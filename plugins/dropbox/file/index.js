const fs = require('fs')
const fetch = require('node-fetch')
const matter = require('gray-matter')
const path = require('path')
const mkdirp = require('mkdirp')
const md = require('markdown-it')({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true
})

module.exports = async function (root, gen, {url}, staticdir) {
  let r = await fetch(url.replace('dl=0', 'dl=1'), {redirect: 'follow'})
  let text = await r.text()

  if (text.toLowerCase().indexOf('<!doctype') !== -1) {
    let filename = url.split('?')[0].split('/').slice(-1)[0]
    let pathtarget = path.join(staticdir, filename)
    mkdirp.sync(path.dirname(pathtarget))
    fs.writeFileSync(pathtarget, text)
  }

  let {content, data} = matter(text)
  await gen('/', 'sitio/component-utils/article.js', {
    html: md.render(content),
    data
  })
}
