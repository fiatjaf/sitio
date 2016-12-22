#!/usr/bin/env fish

set module (dirname (status -f))
set here (dirname pwd)
set target $here/_site
set entry $module/dynamic.js
set Body $here/Body.js
set Helmet $here/Helmet.js
set Wrapper $here/Wrapper.js

set -x BODY (realpath --relative-to=$module $Body)
set -x HELMET (realpath --relative-to=$module $Helmet)
set -x WRAPPER (realpath --relative-to=$module $Wrapper)

echo "here: $here"
echo "module directory: $module"
echo "entry point: $entry"
echo "target directory: $target"
echo "Body component: $Body -- will pass $BODY to $module"
echo "Helmet component: $Helmet -- will pass $HELMET to $module"
echo "Wrapper component: $Wrapper -- will pass $WRAPPER to $module"
echo
echo "resetting or creating $target if it doesn't exist"
mkdir -p $target
echo "adding $here/node_modules and $module/node_modules to NODE_PATH"
set -x NODE_PATH "$here/node_modules:$module/node_modules"
echo
echo "making standalone bundles for all pages (to be loaded asynchronously) and putting those on $target at the same time creating the static html for each page."

function isindex
  set noext (string match -r '\/([^./]+)\.\w+' $argv[1] | tail -n 1)
  return ( [ "$noext" = 'index' ] )
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

echo

set lastmodstanda (filedate $Wrapper)
set lastmodstatic (max (filedate $Body) (filedate $Helmet))
for path in (find $here -iregex '.*\.\(js\|md\|txt\)$' ! -path './node_modules/*' ! -path './.*' ! -path './_site/*' ! -path "$Body" ! -path "$Wrapper" ! -path "$Helmet")
  echo "  > $path:"
  set lastmodsrc (filedate $path)

  set -x EMBED (realpath --relative-to=$module $path)
  if isindex $path
    set jspath (string replace -r -a '\.\w*$' '.js' $path)
  else
    set jspath (string replace -r -a '\.\w*$' '/index.js' $path)
  end
  set standalonepath (string replace -r -a '^\.' "$target" $jspath)
  echo "    # standalone: $standalonepath"
  mkdir -p (dirname $standalonepath)
  if [ (max $lastmodsrc $lastmodstanda) -gt (filedate $standalonepath) ]
    browserify --standalone doesntmatter --no-bundle-external --exclude $WRAPPER -t [ $module/node_modules/envify ] -t [ $module/node_modules/stringify --extensions [.md .txt] ] $module/standalone.js > $standalonepath
    echo '      * done.'
  else
    echo '      % already there.'
  end

  if isindex $path
    set htmlpath (string replace -r -a '\.\w*$' '.html' $path)
  else
    set htmlpath (string replace -r -a '\.\w*$' '/index.html' $path)
  end
  set staticpath (string replace -r -a '^\.' "$target" $htmlpath)
  set -x STANDALONE (realpath --relative-to=$module $standalonepath)
  set prepathname (dirname (realpath --relative-to=$target $staticpath))
  if [ $prepathname = $here ]
    set -x PATHNAME /
  else
    set -x PATHNAME /$prepathname/
  end
  echo "    # static: $staticpath"
  mkdir -p (dirname $staticpath)
  if [ (max $lastmodsrc $lastmodstatic) -gt (filedate $staticpath) ]
    node $module/static.js > $staticpath
    echo '      * done.'
  else
    echo '      % already there.'
  end
end

echo
set browserifyMain ( jq --arg entry $entry --arg module $module -rcs '.[0].dependencies * .[1].dependencies | keys | join(" -r ") | "browserify -t $module/node_modules/envify $entry -r \(.)"' $here/package.json $module/package.json )
echo "compiling main bundle: $target/bundle.js with command:"
echo $browserifyMain
eval $browserifyMain > $target/bundle.js
echo "everything is done."
