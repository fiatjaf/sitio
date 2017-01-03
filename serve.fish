#!/usr/bin/env fish

set module (dirname (readlink -m (status -f)))
source $module/lib.fish live
source $module/vars.fish live

echo "watching $filestobuild..."
set -x module $module
set -x port 6464
eval "$depdir/.bin/static $target -a 0.0.0.0 -c 1 -p $port &"
string replace ' ' '\n' $filestobuild | entr fish -c '
if eval $module/build.fish live
  echo
  set_color green
  echo "site built."
  set_color normal
else
  echo
  set_color red
  echo "build failed."
  set_color normal
end
set_color blue
echo "serving at 0.0.0.0:$port"
set_color normal
'
