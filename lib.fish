set module (dirname (readlink -m (status -f)))
set here .
set projectname (string split / (pwd) | tail -n 1)
set target $here/_site
set dynamic $module/dynamic.js

function isindex
  set noext (string match -r '\/([^./]+)\.\w+' $argv[1] | tail -n 1)
  return ( [ "$noext" = 'index' ] )
end
function isroot
  set parts (string split -m 1 --right '/' $argv[1])
  if string match -r '^index\.\w*$' $parts[2] > /dev/null
    if [ $parts[1] = $here ]
      return 0
    end
  end
  return 1
end
function pathname
  if isroot $argv[1]
    echo '/'
  else if isindex $argv[1]
    set dirpath (string match -r '^(\.\/)?(.*)\/index\.\w*$' $argv[1] | tail -n 1)
    echo "/$dirpath/"
  else
    set dirpath (string match -r '^(\.\/)?(.*)\.\w*$' $argv[1] | tail -n 1)
    echo "/$dirpath/"
  end
end
function path_tmp
  echo $tempdir(pathname $argv[1])
end
function path_static
  if isindex $argv[1]
    set htmlpath (string replace -r -a '\.\w*$' '.html' $argv[1])
  else
    set htmlpath (string replace -r -a '\.\w*$' '/index.html' $argv[1])
  end
  string replace -r -a '^\.' "$target" $htmlpath
end
function path_standalone
  if isroot $argv[1]
    set jspath (string replace -r -a '\.\w*$' '.js' $argv[1])
  else if isindex $argv[1]
    set jspath (string replace -r -a '\/index\.\w*$' '.js' $argv[1])
  else
    set jspath (string replace -r -a '\.\w*$' '.js' $argv[1])
  end
  string replace -r -a '^\.' "$target" $jspath
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
function tmpdir
  for t in $TMPDIR $TMP /tmp /var/tmp
    if test -w $t
      set tmp "$t/react-site/$projectname"
      mkdir -p $tmp
      echo $tmp
      break
    end
  end
end

if [ "$argv[1]" = 'live' ]
  set target (tmpdir)/_build
end
