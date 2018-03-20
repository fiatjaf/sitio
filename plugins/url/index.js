const fetch = require('node-fetch')
const matter = require('gray-matter')

module.exports = function (_, gen, {ref}, done) {
  fetch(ref)
    .then(r => r.text())
    .then(text => {
      let {content, data} = matter(text)
      gen('/', 'html.js', {content, data})
      done(null)
    })
    .catch(done)
}
