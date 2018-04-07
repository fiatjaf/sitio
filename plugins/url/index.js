const fs = require('fs')
const util = require('util')
const fetch = require('node-fetch')
const matter = require('gray-matter')
const path = require('path')
const md = require('markdown-it')({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true
})

module.exports = async function (_, gen, {url}, staticdir) {
  let r = await fetch(url)
  let text = await r.text()

  if (text.toLowerCase().startsWith('<!doctype')) {
    return util.promisify(fs.writeFile)(
      path.join(staticdir, 'index.html'),
      text
    )
  } else {
    let {content, data} = matter(text)
    await gen('/', 'sitio/component-utils/article.js', {
      html: md.render(content),
      data
    })
  }
}
