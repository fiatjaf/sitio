const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

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
  title: process.env.PATHNAME.split('/').filter(x => x).slice(-1)[0],
  date: (stat.birthtime < new Date(1972, 1, 1) ? stat.mtime : stat.birthtime).toISOString()
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
