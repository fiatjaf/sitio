/** @format */

const fs = require('fs')
const path = require('path')
const child_process = require('child_process')

function url_pathname(filepath) {
  var target = filepath.replace(/\.\w+$/, '.html')

  let basename = path.basename(target)
  if (basename !== 'index.html') {
    target = path.join(
      path.dirname(target),
      basename.split('.')[0],
      'index.html'
    )
  }

  let pathname = '/' + target.slice(0, -'index.html'.length)
  return pathname
}

module.exports = function(filepath) {
  let pathname = url_pathname(filepath)

  var raw = fs.readFileSync(filepath, 'utf-8')
  var stat = fs.statSync(filepath)
  var content
  try {
    content = require(filepath)
  } catch (e) {
    content = raw
  }

  var data = {
    ext: path.extname(filepath),
    basename: path.basename(filepath),
    filepath,
    pathname,
    raw,
    content
  }

  try {
    data.gitCreated = child_process.execSync(
      `git log --pretty=format:%ai -- '${process.env.FILEPATH}' | tail -n 1`,
      {encoding: 'utf8'}
    )
  } catch (e) {
    delete data.gitCreated
  }
  try {
    data.gitModified = child_process.execSync(
      `git log --pretty=format:%ai -- '${process.env.FILEPATH}' | head -n 1`,
      {encoding: 'utf8'}
    )
  } catch (e) {
    delete data.gitModified
  }

  if (stat.birthtime < new Date(1972, 1, 1)) {
    data.fsCreated = stat.birthtime
  }
  data.fsModified = stat.mtime

  return data
}
