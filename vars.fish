set Body (find $here -maxdepth 1 -iregex '.*\(body\|content\|main\|app\.\).*' ! -path '*/.*' | head -n 1)
set Helmet (find $here -maxdepth 1 -iregex '.*\(head\|helmet\).*' ! -path '*/.*' | head -n 1)
set Wrapper (find $here -maxdepth 1 -iregex '.*wrap.*' ! -path '*/.*' | head -n 1)
set filestobuild (find $here -iregex '.*\.\(js\|md\|txt\|html\|docx\|doc\|rst\|tex\|text\|latex\|asciidoc\|mdown\|markdown\)$' ! -path '*/node_modules/*' ! -path '*/.*' ! -path '*/_site/*' ! -path "$Body" ! -path "$Wrapper" ! -path "$Helmet")
set filestocopy (find $here -iregex '.*\.\(3gp\|aac\|aif\|aiff\|atom\|avi\|bmp\|bz2\|conf\|css\|csv\|doc\|flv\|gif\|gz\|htm\|ico\|ics\|iso\|jar\|jpeg\|jpg\|json\|m3u\|m4a\|m4v\|manifest\|markdown\|mathml\|mid\|midi\|mov\|mp3\|mp4\|mp4v\|mpeg\|mpg\|odp\|ods\|odt\|oga\|ogg\|pdf\|png\|pps\|ppt\|ps\|psd\|qt\|rar\|rdf\|rss\|rtf\|svg\|svgz\|swf\|tar\|tbz\|text\|tif\|tiff\|torrent\|ttf\|wav\|webm\|wma\|wmv\|xls\|xml\|yaml\|yml\|zip\)$' ! -path '*/node_modules/*' ! -path '*/.*' ! -path '*/_site/*') $here/CNAME
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
