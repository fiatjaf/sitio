const h = require('react-hyperscript')
const path = require('path')

module.exports = ({root, name, items, basepath, page, prev, next}) => {
  return [
    !name
      ? null
      : (
        h('header', {key: 'header'}, [
          h('h1', [
            h('a', {
              href: path.join(root, basepath)
              /* cannot be '' because when we're in /p/ urls this
                 must return to the beggining */
            }, name)
          ])
        ])
      ),
    h('section', {key: 'section'}, [
      h('ul', items.map(item =>
        h('li', {key: item.path}, [
          h('article', [
            h('header', [
              item.cover && h('a', {href: path.join(root, item.path)}, [
                h('img', {src: item.cover})
              ]),
              h('h1', [
                h('a', {href: path.join(root, item.path)}, item.name)
              ]),
              h('aside', [
                h('time', {dateTime: item.date}, item.shortDate || item.date),
                item.tags && h('ul', item.tags.map(({slug, name, color}) =>
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
            item.excerpt && h('div', [
              h('p', item.excerpt)
            ])
          ])
        ])
      ))
    ]),
    h('footer', {key: 'footer'}, [
      h('nav', [
        h('ul', [
          h('li', [
            h('a', prev !== undefined && prev > 0
              ? {
                rel: 'prev',
                href: path.join(root, basepath, 'p', prev)
              }
              : {}, '⇐')
          ]),
          h('li', [
            next !== undefined
              ? (
                h('a', {
                  rel: 'next',
                  href: path.join(root, basepath, 'p', next)
                }, '⇒')
              )
              : ''
          ])
        ])
      ])
    ])
  ]
}
