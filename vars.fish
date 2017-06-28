set Body (find $here -maxdepth 1 -iregex '.*\(body\|content\|main\|app\.\).js' ! -path '*/.*' | head -n 1)
set Helmet (find $here -maxdepth 1 -iregex '.*\(head\|helmet\).js' ! -path '*/.*' | head -n 1)
set Wrapper (find $here -maxdepth 1 -iregex '.*wrap.js' ! -path '*/.*' | head -n 1)

# files to build
set base_filestobuild (find $here -iregex '.*\.\(js\|md\|txt\|html\|rst\|tex\|text\|latex\|asciidoc\|mdown\|markdown\)$' ! -path '*/node_modules/*' ! -path '*/.*' ! -path '*/_site/*' ! -name '_*' ! -path "$Body" ! -path "$Wrapper" ! -path "$Helmet")
set attr_buildignore (cat $here/package.json | jq -r 'if has("react-site") then (.["react-site"] | if has("build-ignore") then .["build-ignore"] else [] end) | join(" ") else "" end')
set files_buildignore (eval "ls -Q $attr_buildignore")
set map_buildignore (jq -ncr --arg files "$files_buildignore" '
    $files[1:-1] | split("\" \"") | map({key: (. | ltrimstr("./")), value: 1}) | from_entries
')
set filestobuild
for path in $base_filestobuild
  if [ (echo $map_buildignore | jq -r --arg p "$path" 'if has($p | ltrimstr("./")) then "" else 1 end') ]
    set filestobuild $filestobuild "$path"
  end
end

# files to copy (static, media etc.)
set attr_static (cat $here/package.json | jq -r 'if has("react-site") then (.["react-site"] | if has("static") then .static else [] end) | join(" ") else "" end')
set files_static (eval "ls $attr_static")
set filestocopy (find $here -iregex '.*\.\(3gp\|aac\|aif\|aiff\|atom\|avi\|bmp\|bz2\|conf\|css\|csv\|docx\|doc\|flv\|gif\|gz\|htm\|ico\|ics\|iso\|jar\|jpeg\|jpg\|json\|m3u\|m4a\|m4v\|manifest\|markdown\|mathml\|mid\|midi\|mov\|mp3\|mp4\|mp4v\|mpeg\|mpg\|odp\|ods\|odt\|oga\|ogg\|pdf\|png\|pps\|ppt\|ps\|psd\|qt\|rar\|rdf\|rss\|rtf\|svg\|svgz\|swf\|tar\|tbz\|text\|tif\|tiff\|torrent\|ttf\|wav\|webm\|wma\|wmv\|xls\|xml\|yaml\|yml\|zip\)$' ! -path '*/node_modules/*' ! -path '*/.*' ! -path '*/_site/*') 
for path in $files_static
  set filestocopy $filestocopy "$here/$path"
end

set tempdir (tmpdir)

set -x BODY (realpath --relative-to=$here $Body)
set -x HELMET (realpath --relative-to=$here $Helmet)
set -x WRAPPER (realpath --relative-to=$here $Wrapper)

if [ ! "$argv[1]" = 'live' ]
  echo -n "here: "; set_color magenta; echo "$here"; set_color normal
  echo -n "module directory: "; set_color magenta; echo "$module"; set_color normal
  echo -n "entry point: "; set_color magenta; echo "$dynamic"; set_color normal
  echo -n "target directory: "; set_color magenta; echo "$target"; set_color normal
  echo -n "temp dir for content modules: "; set_color magenta; echo "$tempdir"; set_color normal
  echo -n "Body component: "; set_color magenta; echo -n "$Body"; set_color normal; echo " -- will pass $BODY to $module"
  echo -n "Helmet component: "; set_color magenta; echo -n "$Helmet"; set_color normal; echo " -- will pass $HELMET to $module"
  echo -n "Wrapper component: "; set_color magenta; echo -n "$Wrapper"; set_color normal; echo " -- will pass $WRAPPER to $module"
  echo -n "files to build: "; set_color magenta; echo "$filestobuild"; set_color normal
  echo -n "files to copy: "; set_color magenta; echo "$filestocopy"; set_color normal
  echo
end
