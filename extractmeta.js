const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')
const toText = require('html-to-text')
const child_process = require('child_process')

var raw = fs.readFileSync(path.join(__dirname, process.env.FILELOCATION), 'utf-8')
var stat = fs.statSync(path.join(__dirname, process.env.FILELOCATION))
var content
try {
  content = require(process.env.FILELOCATION)
} catch (e) {
  content = raw
}
var ext = process.env.FILELOCATION.split('.').slice(-1)[0]

var meta = {
  filename: process.env.FILEPATH,
  pathname: process.env.PATHNAME,
  title: process.env.PATHNAME.split('/').filter(x => x).slice(-1)[0]
}

try {
  meta.date = child_process.execSync(
    `git log --pretty=format:%ai -- '${process.env.FILEPATH}' | tail -n 1`,
    {
      encoding: 'utf8'
    }
  )
  if (!meta.date) throw new Error("couldn't get date from git.")
} catch (e) {
  meta.date = (
    stat.birthtime < new Date(1972, 1, 1)
    ? stat.mtime
    : stat.birthtime
  ).toISOString()
}

var contentpath = process.env.CONTENTPATH

switch (ext) {
  case 'txt':
  case 'text':
  case 'html':
  case 'md':
  case 'mdown':
  case 'markdown':
    var p
    try {
      p = matter(content)
    } catch (e) {
      p = {content: '', data: {}}
    }

    if (!p.data.hasOwnProperty('summary')) {
      // we'll try to extract a summary if it is not previously set
      p.data.summary = extractSummary(p.content, ext)
    }

    console.log(JSON.stringify(Object.assign(meta, p.data)))
    fs.writeFileSync(contentpath, `module.exports = ${JSON.stringify(p.content)}`, 'utf-8')
    break
  case 'js':
  case 'es':
  case 'es6':
  case 'jsx':
  case 'react':
    console.log(JSON.stringify(Object.assign(meta, content.meta)))
    fs.writeFileSync(contentpath, raw, 'utf-8')
    break
  default:
    console.log(JSON.stringify(meta))
    fs.writeFileSync(contentpath, `module.exports = ${JSON.stringify(raw)}`, 'utf-8')
}

function extractSummary (content, ext) {
  var text = ext === 'html'
    ? toText.fromString(p.content, {ignoreHref: true, ignoreImage: true, wordwrap: 99999})
    : p.content

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
