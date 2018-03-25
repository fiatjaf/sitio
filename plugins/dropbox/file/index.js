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

module.exports = function (root, gen, {url}, staticdir, done) {
  fetch(url.replace('dl=0', 'dl=1'), {redirect: 'follow'})
    .then(r => r.text())
    .then(text => {
      if (text.toLowerCase().indexOf('<!doctype') !== -1) {
        let filename = url.split('?')[0].split('/').slice(-1)[0]
        let pathtarget = path.join(staticdir, filename)
        mkdirp.sync(path.dirname(pathtarget))
        fs.writeFileSync(pathtarget, text)
      }

      let {content, data} = matter(text)
      gen('/', 'sitio/component-utils/html.js', {
        html: md.render(content),
        data
      })
    })
    .then(() => done(null))
    .catch(done)
}
