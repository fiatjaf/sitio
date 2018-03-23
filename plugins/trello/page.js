const h = require('react-hyperscript')
const md = require('markdown-it')({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true
})

module.exports = ({content}) =>
  h('article', {
    dangerouslySetInnerHTML: {__html: md.render(content)}
  })
