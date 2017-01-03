#!/usr/bin/env fish

set module (dirname (readlink -m (status -f)))
if [ "$argv[1]" = 'live' ]
  source $module/lib.fish live
  source $module/vars.fish live
  set -x NODE_ENV development
else
  source $module/lib.fish
  source $module/vars.fish
  set -x NODE_ENV production
end

echo "resetting or creating $target if it doesn't exist"
mkdir -p $target
echo "adding $here, $here/node_modules and $module/node_modules to NODE_PATH"
set -x NODE_PATH "$here:$here/node_modules:$module/node_modules"

echo
echo "extracting metadata from files"
set -g pagesmeta '{}'
for path in $filestobuild
  set -x FILEPATH $path
  set -x FILELOCATION (realpath --relative-to=$module $path)
  set -x PATHNAME (pathname $path)
  set tmppath (path_tmp $path)
  set metapath "$tmppath"meta.json
  set -x CONTENTPATH "$tmppath"content.js
  set_color -u
  set_color white
  echo -n "$path"
  set_color normal
  echo -n " to $tmppath"
  registerdep $CONTENTPATH $path
  registerdep $CONTENTPATH $module/extractmeta.js
  if depschanged $CONTENTPATH
    mkdir -p $tmppath
    set meta (node $module/extractmeta.js)
    echo $meta > $metapath
    set_color green; echo ' done.'; set_color normal
  else
    set meta (cat $metapath)
    set_color blue; echo ' already there.'; set_color normal
  end
  set -g pagesmeta (echo $pagesmeta | jq -c --arg meta $meta --arg key $PATHNAME '.[$key] = ($meta | fromjson)')
end

echo
echo "making standalone bundles for all pages (to be loaded asynchronously) and putting those on $target at the same time creating the static html for each page."
echo

set -x ALLPAGESMETA (echo $pagesmeta | jq -c .)

for path in $filestobuild
  echo -n "  > "
  set_color -u white
  echo -n "$path"
  set_color normal
  echo ":"

  set -x CONTENTPATH (path_tmp $path)content.js
  set -x META (echo $pagesmeta | jq -c --arg key (pathname $path) '.[$key]')

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
    set_color green; echo ': done.'; set_color normal
  else
    set_color blue; echo ': already there.'; set_color normal
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
  set browserifyMain ( jq -rcs '.[0].dependencies * .[1].dependencies | keys | join(" -r ") | "browserify --ignore coffee-script --ignore toml \(if "'$NODE_ENV'" != "production" then "--debug" else "" end) -t '$module'/node_modules/envify '$dynamic' -r '$WRAPPER' -r \(.)"' $here/package.json $module/package.json )
  echo "compiling main bundle: $target/bundle.js with command:"
  echo $browserifyMain
  eval "$browserifyMain" > $target/bundle.js
  if [ "$NODE_ENV" = 'production' ]
    echo
    echo "minifying..."
    eval "$module/node_modules/.bin/uglifyjs $target/bundle.js --compress --screw-ie8 --mangle" > $target/bundle.min.js 2> /dev/null
    mv $target/bundle.min.js $target/bundle.js
  end
  set_color green
  echo "done."
  set_color normal
else
  set_color blue
  echo "$target/bundle.js: main bundle doesn't need to be rebuilt."
  set_color normal
end

echo
echo 'copying static files to the build directory.'
for file in $filestocopy
  set dst (string replace $here $target $file)
  if [ -d (dirname $dst) ]
    echo "  $file to $dst"
    cp $file $dst
  end
end

echo
echo "everything is done."
