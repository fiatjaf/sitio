#!/usr/bin/env fish

set module (dirname (status -f))
set here (dirname pwd)
set target $here/_site
set dynamic $module/dynamic.js
set Body $here/Body.js
set Helmet $here/Helmet.js
set Wrapper $here/Wrapper.js

set -x BODY (realpath --relative-to=$here $Body)
set -x HELMET (realpath --relative-to=$here $Helmet)
set -x WRAPPER (realpath --relative-to=$here $Wrapper)

echo "here: $here"
echo "module directory: $module"
echo "entry point: $dynamic"
echo "target directory: $target"
echo "Body component: $Body -- will pass $BODY to $module"
echo "Helmet component: $Helmet -- will pass $HELMET to $module"
echo "Wrapper component: $Wrapper -- will pass $WRAPPER to $module"
echo
echo "resetting or creating $target if it doesn't exist"
mkdir -p $target
echo "adding $here, $here/node_modules and $module/node_modules to NODE_PATH"
set -x NODE_PATH "$here:$here/node_modules:$module/node_modules"
echo
echo "making standalone bundles for all pages (to be loaded asynchronously) and putting those on $target at the same time creating the static html for each page."

function isindex
  set noext (string match -r '\/([^./]+)\.\w+' $argv[1] | tail -n 1)
  return ( [ "$noext" = 'index' ] )
end
function isroot
  return ( string match -r "$here\/index\." $argv[1] > /dev/null )
end
function max
  echo $argv | tr " " "\n" | sort -nr | head -n 1
end
function filedate
  if [ -s $argv[1] ]
    date -r $argv[1] +%s
  else
    echo 0
  end
end
function registerdep
  set fileid (filedate $argv[1])
  set dep $argv[2]
  set deparrayname "deps$fileid"
  set -g $deparrayname $$deparrayname (filedate $dep)
end
function depschanged
  set fileid (filedate $argv[1])
  set deparrayname "deps$fileid"
  return ( [ (max $$deparrayname) -gt $fileid ] )
end

echo

for path in (find $here -iregex '.*\.\(js\|md\|txt\)$' ! -path './node_modules/*' ! -path './.*' ! -path './_site/*' ! -path "$Body" ! -path "$Wrapper" ! -path "$Helmet")
  echo "  > $path:"

  set -x EMBED (realpath --relative-to=$module $path)
  if isroot $path
    set jspath (string replace -r -a '\.\w*$' '.js' $path)
  else if isindex $path
    set jspath (string replace -r -a '\/index\.\w*$' '.js' $path)
  else
    set jspath (string replace -r -a '\.\w*$' '.js' $path)
  end
  set standalonepath (string replace -r -a '^\.' "$target" $jspath)
  mkdir -p (dirname $standalonepath)
  registerdep $standalonepath $module/standalone.js
  registerdep $standalonepath $path
  registerdep $standalonepath $Wrapper
  echo -n "    # standalone: '$standalonepath'"
  if depschanged $standalonepath
    browserify --standalone doesntmatter --no-bundle-external --exclude $WRAPPER -t [ $module/node_modules/envify ] -t [ $module/node_modules/stringify --extensions [.md .txt] ] $module/standalone.js > $standalonepath
    echo ': done.'
  else
    echo ': already there.'
  end

  if isindex $path
    set htmlpath (string replace -r -a '\.\w*$' '.html' $path)
  else
    set htmlpath (string replace -r -a '\.\w*$' '/index.html' $path)
  end
  set staticpath (string replace -r -a '^\.' "$target" $htmlpath)
  set -x STANDALONE (realpath --relative-to=$module $standalonepath)
  if isroot $path
    set -x PATHNAME /
  else
    set -x PATHNAME /$prepathname/
  end
  mkdir -p (dirname $staticpath)
  registerdep $staticpath $module/standalone.js
  registerdep $staticpath $path
  registerdep $staticpath $Body
  registerdep $staticpath $Helmet
  echo -n "    # static: '$staticpath'"
  if depschanged $staticpath
    node $module/static.js > $staticpath
    echo ': done.'
  else
    echo ': already there.'
  end
end

echo
registerdep $target/bundle.js $dynamic
registerdep $target/bundle.js $Body
registerdep $target/bundle.js $Helmet
if depschanged $target/bundle.js
  set browserifyMain ( jq --arg dynamic $dynamic --arg module $module --arg WRAPPER $WRAPPER -rcs '.[0].dependencies * .[1].dependencies | keys | join(" -r ") | "browserify --debug -t $module/node_modules/envify $dynamic -r $WRAPPER -r \(.)"' $here/package.json $module/package.json )
  echo "compiling main bundle: $target/bundle.js with command:"
  echo $browserifyMain
  eval $browserifyMain > $target/bundle.js
else
  echo "$target/bundle.js: main bundle doesn't need to be rebuilt."
end
echo
echo "everything is done."
