const Trello = require('node-trello')
const parallel = require('run-parallel')

const {
  slugify,
  fillWithDates,
  cardPageProps,
  makePagination
} = require('../helpers')

module.exports = function (root, gen, {
  ref,
  apiKey,
  apiToken,
  postsPerPage = 7,
  excerpts = true
}, staticdir, done) {
  const t = new Trello(apiKey, apiToken)
  const boardId = ref.startsWith('http:')
    ? ref.split('/')[4]
    : ref
  const ppp = typeof postsPerPage === 'string' ? JSON.parse(postsPerPage) : postsPerPage
  excerpts = typeof postsPerPage === 'string' ? JSON.parse(excerpts) : excerpts

  parallel([
    done => t.get(`/1/boards/${boardId}/lists`, {
      fields: 'name',
      cards: 'none'
    }, done),
    done => t.get(`/1/boards/${boardId}/labels`, {
      fields: 'name,color'
    }, done),
    done => t.get(`/1/boards/${boardId}/cards`, {
      fields: 'name,desc,due,idList,shortLink,labels',
      attachments: 'cover',
      attachment_fields: 'url',
      checklists: 'all',
      checkItemStates: true,
      members: true,
      member_fields: 'username,avatarHash',
      label_fields: 'color,name'
    }, done)
  ], (err, [lists, labels, cards]) => {
    if (err) {
      return done(err)
    }

    cards = cards.filter(({name}) => name[0] !== '_')

    cards.forEach(card => {
      card.slug = slugify(card.name)
      card.cover = card.attachments ? card.attachments[0].url : null

      fillWithDates(card)
    })

    // list pages and pagination
    lists
      .filter(({name}) => name[0] !== '_')
      .filter(({name}) => name[0] !== '#')
      .forEach(list => {
        list.slug = slugify(list.name)

        let cardsHere = cards.filter((card, i) => {
          let belongsHere = card.idList === list.id

          // take this moment to set the list slug on the card object
          if (belongsHere) {
            card.listName = list.name
            card.url = `${root}/${list.slug}/${card.slug}`
          }

          return belongsHere
        })

        var page = 1
        while ((page - 1) * ppp < cards.length) {
          makePagination(gen, `${root}/${list.slug}`, cardsHere, page, {ppp, excerpts}, {
            name: list.name
          })
          page++
        }
      })

    // label pages and pagination
    labels.forEach(label => {
      label.slug = slugify(label.name) || label.id

      let cardsHere = cards
        .filter(({labels}) =>
          labels.filter(l => l === label.name || l === label.id).length
        )

      var page = 1
      while ((page - 1) * ppp < cards.length) {
        makePagination(gen, `${root}/${label.slug}`, cardsHere, page, {ppp, excerpts}, {
          name: label.name
        })
        page++
      }
    })

    // home card and pagination
    let homeCards = cards
      .filter(card => card.listName)
      .sort((a, b) => a.date < b.date ? 1 : -1)

    var page = 1
    while ((page - 1) * ppp < cards.length) {
      makePagination(gen, root, homeCards, {ppp, excerpts})
      page++
    }

    // each card page
    cards
      .filter(card => card.listName /* if there's no listName it means no */)
      .map(card => {
        gen(card.url, '../card-component.js', cardPageProps(card))

        // permalink based on card id or shortLink
        gen(`/c/${card.id}`, '../redirect.js', {target: card.url})
        gen(`/c/${card.shortLink}`, '../redirect.js', {target: card.url})
      })

    // cards that are absolute pages
    cards
      .filter(({listName, name}) => !listName && name[0] === '/')
      .forEach(card =>
        gen(card.name, '../page.js', {
          content: card.desc
        })
      )
  })
}
