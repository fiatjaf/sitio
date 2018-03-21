const h = require('react-hyperscript')

module.exports = props => [
  h('header', {key: 'header'}),
  h('article', {key: 'article'}, [
    h('header', [
      h('h1', [
        h('a', {rel: 'bookmark', href: props.root}, props.title)
      ]),
      h('aside', [
        h('time', {dateTime: props.date}, props.date)
      ])
    ]),
    h('div', {
      dangerouslySetInnerHTML: {__html: props.content}
    })
  ])
]
