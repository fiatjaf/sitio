const fs = require('fs')
const fetch = require('node-fetch')
const matter = require('gray-matter')
const path = require('path')

module.exports = function (_, gen, data, staticdir, done) {
  let url = data.url
  let fullPage = data['full-page']

  fetch(url)
    .then(r => r.text())
    .then(text => {
      if (fullPage) {
        fs.writefile(
          path.join(staticdir, 'index.html'),
          text,
          done
        )
      } else {
        let {content, data} = matter(text)
        gen('/', 'html.js', {content, data})
        done(null)
      }
    })
    .catch(done)
}
