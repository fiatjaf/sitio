#!/usr/bin/env fish

function help
  echo "react-site - simple and hackable static website generator with React and browserify.
usage: react-site <command> [options]
commands:
    build - builds the site at the current directory, saves the output at ./_site/
        options:
            
    serve - starts watching files to rebuild the site and serving them. 
        options:

more information may be available at https://github.com/fiatjaf/react-site"
end

if [ (echo $argv | wc -w) -lt 1 ]
  help
  exit 1
end

set module (dirname (readlink -m (status -f)))

switch $argv[1]
  case 'build'
    fish $module/build.fish $argv
  case 'serve'
    fish $module/serve.fish $argv
  case '--help'
    help
    exit 0
  case '*'
    help
    exit 1
end
