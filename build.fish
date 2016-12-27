#!/usr/bin/env fish

set module (dirname (readlink -m (status -f)))
source $module/lib.fish

set Body (find $here -maxdepth 1 -iregex '.*\(body\|content\|main\|app\.\).*' | head -n 1)
set Helmet (find $here -maxdepth 1 -iregex '.*\(head\|helmet\).*' | head -n 1)
set Wrapper (find $here -maxdepth 1 -iregex '.*wrap.*' | head -n 1)
set filestobuild (find $here -iregex '.*\.\(js\|md\|txt\)$' ! -path "$here/node_modules/*" ! -path "$here/.*" ! -path "$here/_site/*" ! -path "$Body" ! -path "$Wrapper" ! -path "$Helmet")
set tempdir (tmpdir)

set -x BODY (realpath --relative-to=$here $Body)
set -x HELMET (realpath --relative-to=$here $Helmet)
set -x WRAPPER (realpath --relative-to=$here $Wrapper)

echo -n "here: "; set_color magenta; echo "$here"; set_color normal
echo -n "module directory: "; set_color magenta; echo "$module"; set_color normal
echo -n "entry point: "; set_color magenta; echo "$dynamic"; set_color normal
echo -n "target directory: "; set_color magenta; echo "$target"; set_color normal
echo -n "temp dir for content modules: "; set_color magenta; echo "$tempdir"; set_color normal
echo -n "Body component: "; set_color magenta; echo -n "$Body"; set_color normal; echo " -- will pass $BODY to $module"
echo -n "Helmet component: "; set_color magenta; echo -n "$Helmet"; set_color normal; echo " -- will pass $HELMET to $module"
echo -n "Wrapper component: "; set_color magenta; echo -n "$Wrapper"; set_color normal; echo " -- will pass $WRAPPER to $module"
echo
echo "resetting or creating $target if it doesn't exist"
mkdir -p $target
echo "adding $here, $here/node_modules and $module/node_modules to NODE_PATH"
set -x NODE_PATH "$here:$here/node_modules:$module/node_modules"

echo
echo "extracting metadata from files"
set -g metapages '{}'
for path in $filestobuild
  set -x FILEPATH (realpath --relative-to=$module $path)
  set -x PATHNAME (pathname $path)
  set -x CONTENTPATH (path_content $path)
  set_color purple
  echo "  $path"
  set_color normal
  mkdir -p (dirname $CONTENTPATH)
  set -g metapages (echo $metapages | jq -c --arg meta (node $module/extractmeta.js) --arg path $path '.[$path] = ($meta | fromjson)')
end

echo
echo "making standalone bundles for all pages (to be loaded asynchronously) and putting those on $target at the same time creating the static html for each page."
echo

set -x ALLPAGESMETA (echo $metapages | jq -c .)

for path in $filestobuild
  echo -n "  > "
  set_color -u white
  echo -n "$path"
  set_color normal
  echo ":"

  set -x CONTENTPATH (path_content $path)
  set -x META (echo $metapages | jq -c --arg path $path '.[$path]')

  set standalonepath (path_standalone $path)
  mkdir -p (dirname $standalonepath)
  registerdep $standalonepath $path
  registerdep $standalonepath $Wrapper
  registerdep $standalonepath $module
  registerdep $standalonepath $here/node_modules
  echo -n "    # "
  set_color brbrown
  echo -n "standalone"
  set_color normal
  echo -n ": '$standalonepath'"
  if depschanged $standalonepath
    browserify --standalone doesntmatter --no-bundle-external --exclude $WRAPPER -t [ $module/node_modules/envify ] $module/standalone.js > $standalonepath
    set_color green
    echo ': done.'
    set_color normal
  else
    set_color blue
    echo ': already there.'
    set_color normal
  end

  set staticpath (path_static $path)
  set -x STANDALONE (realpath --relative-to=$module $standalonepath)
  mkdir -p (dirname $staticpath)
  registerdep $staticpath $path
  registerdep $staticpath $Body
  registerdep $staticpath $Helmet
  registerdep $staticpath $module
  registerdep $staticpath $here/node_modules
  echo -n "    # "
  set_color brbrown
  echo -n "static"
  set_color normal
  echo -n ": '$staticpath'"
  if depschanged $staticpath
    node $module/static.js > $staticpath
    set_color green
    echo ': done.'
    set_color normal
  else
    set_color blue
    echo ': already there.'
    set_color normal
  end
end

echo
registerdep $target/bundle.js $dynamic
registerdep $target/bundle.js $Body
registerdep $target/bundle.js $Helmet
registerdep $target/bundle.js $module
registerdep $target/bundle.js $here/node_modules
if depschanged $target/bundle.js
  set browserifyMain ( jq --arg dynamic $dynamic --arg module $module --arg WRAPPER $WRAPPER -rcs '.[0].dependencies * .[1].dependencies | keys | join(" -r ") | "browserify --ignore coffee-script --ignore toml --debug -t $module/node_modules/envify $dynamic -r $WRAPPER -r \(.)"' $here/package.json $module/package.json )
  echo "compiling main bundle: $target/bundle.js with command:"
  echo $browserifyMain
  eval $browserifyMain > $target/bundle.js
  set_color green
  echo "done."
  set_color normal
else
  set_color blue
  echo "$target/bundle.js: main bundle doesn't need to be rebuilt."
  set_color normal
end
echo
echo "everything is done."
