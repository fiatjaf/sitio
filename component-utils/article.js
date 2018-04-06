const h = require('react-hyperscript')
const path = require('path')

module.exports = function ({html, data, location, root}) {
  if (!data || Object.keys(data).length === 0 || data.isFullArticle) {
    return h('article', {
      dangerouslySetInnerHTML: {__html: html}
    })
  }

  let parentURL = location.pathname.slice(-1)[0] === '/'
    ? '..'
    : '.'


  return [
    !data.parentName
      ? null
      : (
        h('header', {key: 'header'}, [
          h('h1', [
            h('a', {href: parentURL}, data.parentName)
          ])
        ])
      ),
    h('article', {key: 'article'}, [
      h('header', [
        data.cover && h('img', {src: data.cover}),
        h('h1', [
          h('a', {rel: 'bookmark', href: ''}, data.name)
        ]),
        h('aside', [
          data.date && h('time', {dateTime: data.date}, data.prettyDate || data.date),
          h('ul', (data.tags || []).map(({slug, name, color}) =>
            h('li', {key: slug || name}, [
              h('a', {
                rel: 'tag',
                href: path.join(root, 'tag', slug || name) + '/',
                style: {backgroundColor: color},
                className: name
              }, name || h('span', {
                dangerouslySetInnerHTML: {__html: '&nbsp;&nbsp;&nbsp;'}
              }))
            ])
          ))
        ])
      ]),
      h('div', {
        dangerouslySetInnerHTML: {__html: html}
      })
    ])
  ]
}
