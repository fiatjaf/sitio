const h = require('react-hyperscript')
const path = require('path')

module.exports = props => {
  return [
    !props.name
      ? null
      : (
        h('header', {key: 'header'}, [
          h('h1', [
            h('a', {
              href: path.join(props.root, props.basepath)
              /* cannot be '' because when we're in /p/ urls this
                 must return to the beggining */
            }, props.name)
          ])
        ])
      ),
    h('section', {key: 'section'}, [
      h('ul', props.cards.map(card =>
        h('li', {key: card.path}, [
          h('article', [
            h('header', [
              card.cover && h('a', {href: path.join(props.root, card.path)}, [
                h('img', {src: card.cover})
              ]),
              h('h1', [
                h('a', {href: path.join(props.root, card.path)}, card.name)
              ]),
              h('aside', [
                h('time', {dateTime: card.date}, card.shortDate)
              ])
            ]),
            h('div', [
              h('p', card.excerpt)
            ])
          ])
        ])
      ))
    ]),
    h('footer', {key: 'footer'}, [
      h('nav', [
        h('ul', [
          h('li', [
            h('a', props.prev !== undefined
              ? {
                rel: 'prev',
                href: path.join(props.root, props.basepath, 'p', props.prev)
              }
              : {}, '⇐')
          ]),
          h('li', [
            props.next !== undefined
              ? (
                h('a', {
                  rel: 'next',
                  href: path.join(props.root, props.basepath, 'p', props.next)
                }, '⇒')
              )
              : ''
          ])
        ])
      ])
    ])
  ]
}
