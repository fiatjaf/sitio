const h = require('react-hyperscript')

module.exports = props => {
  return [
    props.home
      ? null
      : h('header', {key: 'header'}, [
        h('h1', [
          h('a', {href: props.root}, props.name)
        ])
      ]),
    h('section', {key: 'section'}, [
      h('ul', props.cards.map(card =>
        h('li', {key: card.shortLink}, [
          h('article', [
            h('header', [
              card.cover && h('a', {href: `${props.root}/${card.slug}/`}, [
                h('img', {src: card.cover})
              ]),
              h('h1', [
                h('a', {href: `${props.root}/${card.slug}/`}, card.name)
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
              ? {rel: 'prev', href: `${props.root}/p/${props.prev}`}
              : {}, '⇐')
          ]),
          h('li', [
            props.next !== undefined
              ? h('a', {rel: 'next', href: `${props.root}/p/${props.next}`}, '⇒')
              : ''
          ])
        ])
      ])
    ])
  ]
}
