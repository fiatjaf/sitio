set Body (find $here -maxdepth 1 -iregex '.*\(body\|content\|main\|app\.\).*' ! -path '*/.*' | head -n 1)
set Helmet (find $here -maxdepth 1 -iregex '.*\(head\|helmet\).*' ! -path '*/.*' | head -n 1)
set Wrapper (find $here -maxdepth 1 -iregex '.*wrap.*' ! -path '*/.*' | head -n 1)
set filestobuild (find $here -iregex '.*\.\(js\|md\|txt\)$' ! -path "$here/node_modules/*" ! -path "$here/.*" ! -path "$here/_site/*" ! -path "$Body" ! -path "$Wrapper" ! -path "$Helmet")
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
  echo
end
