const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')
const toText = require('html-to-text')
const child_process = require('child_process')

module.exports = function (filepath) {
  var raw = fs.readFileSync(path.join(__dirname, filepath), 'utf-8')
  var stat = fs.statSync(path.join(__dirname, filepath))
  var content
  try {
    content = require(filepath)
  } catch (e) {
    content = raw
  }

  var meta = {
    filename: filepath.split('/').slice(-1)[0],
    pathname: filepath,
    ext: filepath.split('.').slice(-1)[0],
    raw,
    content
  }

  try {
    meta.gitCreated = child_process.execSync(
      `git log --pretty=format:%ai -- '${process.env.FILEPATH}' | tail -n 1`,
      {encoding: 'utf8'}
    )
  } catch (e) { delete meta.gitCreated }
  try {
    meta.gitModified = child_process.execSync(
      `git log --pretty=format:%ai -- '${process.env.FILEPATH}' | head -n 1`,
      {encoding: 'utf8'}
    )
  } catch (e) { delete meta.gitModified }

  if (stat.birthtime < new Date(1972, 1, 1)) {
    meta.fsCreated = stat.birthtime
  }
  meta.fsModified = stat.mtime

  return meta
}

module.exports.preprocess = preprocess
function preprocess (data) {
  switch (data.ext) {
    case 'txt':
    case 'text':
    case 'html':
    case 'md':
    case 'markdown':
      var p
      try {
        p = matter(data.content)
      } catch (e) {
        p = {content: '', data: {}}
      }

      if (!p.data.hasOwnProperty('summary')) {
        // we'll try to extract a summary if it is not previously set
        p.data.summary = extractSummary(p.content, data.ext)
      }

      data = Object.assign(data, p.data)
      // console.log(JSON.stringify(data))
      // fs.writeFileSync(contentpath, `module.exports = ${JSON.stringify(p.content)}`, 'utf-8')
      break
    case 'js':
    case 'es':
    case 'es6':
    case 'jsx':
    case 'react':
      data = Object.assign(data, data.content.meta)
      // console.log(JSON.stringify(data))
      // fs.writeFileSync(contentpath, raw, 'utf-8')
      break
    default:
      // console.log(JSON.stringify(data))
      // fs.writeFileSync(contentpath, `module.exports = ${JSON.stringify(raw)}`, 'utf-8')
  }

  return data
}

module.exports.extractSummary = extractSummary
function extractSummary (content, ext) {
  var text = ext === 'html'
    ? toText.fromString(content, {ignoreHref: true, ignoreImage: true, wordwrap: 99999})
    : content

  var summary = ''

  var chars = text.split('')
  for (var i = 0; i < chars.length; i++) {
    var ch = chars[i]
    summary += ch
    if (ch === '\n' && chars[i + 1] === '\n' && summary.length > 300) {
      // paragraph
      break
    }
    if (ch === ' ' && summary.length >= 450) {
      // word break
      break
    }
    if (summary.length > 500) {
      // hard limit
      summary = summary.slice(0, 450)
      break
    }
  }

  // remove header lines
  summary = summary
    .split('\n')
    .filter(line => line !== line.toUpperCase())
    .join('\n')

  return summary
}
