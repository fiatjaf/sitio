const h = require('react-hyperscript')
const path = require('path')
const md = require('markdown-it')({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true
})

module.exports = props => {
  let parentList = props.location.pathname.slice(-1)[0] === '/'
    ? '..'
    : '.'

  return [
    !props.listName
      ? null
      : (
        h('header', {key: 'header'}, [
          h('h1', [
            h('a', {href: parentList}, props.listName)
          ])
        ])
      ),
    h('article', {key: 'article'}, [
      h('header', [
        props.cover && h('img', {src: props.cover}),
        h('h1', [
          h('a', {rel: 'bookmark', href: ''}, props.name)
        ]),
        h('aside', [
          h('time', {dateTime: props.date}, props.prettyDate),
          h('ul', props.labels.map(({slug, name, color}) =>
            h('li', {key: slug}, [
              h('a', {rel: 'tag', href: path.join(props.root, 'tag', slug)},
                name || h('span', {
                  dangerouslySetInnerHTML: {__html: '&nbsp;&nbsp;&nbsp;'}
                })
              )
            ])
          ))
        ])
      ]),
      h('div', {
        dangerouslySetInnerHTML: {__html: md.render(props.desc)}
      })
    ])
  ]
}
