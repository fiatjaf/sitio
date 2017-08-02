const path = require('path')

const dir = path.join(process.cwd(), '_site')

module.exports = function (filepath) {
  var targetpath
  let targetfile = path.join(dir, filepath).replace(/\.\w+$/, '.html')
  let basename = path.basename(targetfile)
  if (basename !== 'index.html') {
    targetpath = path.join(
      path.dirname(targetfile),
      basename.split('.')[0],
      'index.html'
    )
  } else {
    targetpath = targetfile
  }

  let pathname = targetpath.slice(dir.length, -('index.html').length)

  return {
    filepath, // path of the file being rendered in the filesystem
    targetpath, // path of the rendered html file
    pathname // path of the page in the live site (starts with a slash and omits index.html, for example)
  }
}
