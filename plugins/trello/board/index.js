const util = require('util')
const Trello = require('node-trello')
const md = require('markdown-it')({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true
})

const {
  slugify,
  fillWithDates,
  cardPageProps,
  makePagination,
  colors
} = require('../helpers')

module.exports = async function (root, gen, {
  ref,
  apiKey,
  apiToken,
  postsPerPage = 7,
  excerpts = true
}, staticdir) {
  const t = new Trello(apiKey, apiToken)
  const boardId = ref.startsWith('http')
    ? ref.split('/')[4]
    : ref
  const ppp = postsPerPage

  let [lists, labels, cards] = await Promise.all([
    util.promisify(t.get)(`/1/boards/${boardId}/lists`, {
      fields: 'name',
      cards: 'none'
    }),
    util.promisify(t.get)(`/1/boards/${boardId}/labels`, {
      fields: 'name,color'
    }),
    util.promisify(t.get)(`/1/boards/${boardId}/cards`, {
      fields: 'name,desc,due,idList,shortLink,idLabels',
      attachments: 'cover',
      attachment_fields: 'url',
      checklists: 'all',
      checkItemStates: true,
      members: true,
      member_fields: 'username,avatarHash',
      label_fields: 'color,name'
    })
  ])

  // standardize labels
  var labelMap = {}
  labels.forEach(label => {
    label.name = label.name || label.color
    label.slug = slugify(label.name)

    labelMap[label.id] = {
      name: label.name,
      slug: label.slug,
      color: colors[label.color]
    }
  })

  cards = cards.filter(({name}) => name[0] !== '_')
  cards.forEach(card => {
    card.slug = slugify(card.name)
    card.cover = card.attachments ? card.attachments[0].url : null
    card.labels = card.idLabels.map(idl => labelMap[idl])
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
          card.path = `/${list.slug}/${card.slug}`
        }

        return belongsHere
      })

      var page = 1
      while ((page - 1) * ppp < cards.length) {
        makePagination(gen, `/${list.slug}`, cardsHere, page, {ppp, excerpts}, {
          name: list.name,
          root
        })
        page++
      }
    })

  // label pages and pagination
  labels.forEach(label => {
    let cardsHere = cards
      .filter(card => card.listName /* if there's no listName it means no */)
      .filter(({idLabels}) => idLabels.filter(idl => idl === label.id).length)

    var page = 1
    while ((page - 1) * ppp < cards.length) {
      makePagination(gen, `/tag/${label.slug}`, cardsHere, page, {ppp, excerpts}, {
        name: label.name,
        root
      })
      page++
    }
  })

  // home card and pagination
  let homeCards = cards
    .filter(card => card.listName /* if there's no listName it means no */)
    .sort((a, b) => a.date < b.date ? 1 : -1)

  var page = 1
  while ((page - 1) * ppp < cards.length) {
    makePagination(gen, '/', homeCards, page, {ppp, excerpts}, {root})
    page++
  }

  // each card page
  cards
    .filter(card => card.listName /* if there's no listName it means no */)
    .map(card => {
      gen(card.path, 'sitio/component-utils/article.js', cardPageProps(card, {root}))

      // permalink based on card id or shortLink
      gen(`/c/${card.id}`, 'sitio/component-utils/redirect.js', {target: card.path})
      gen(`/c/${card.shortLink}`, 'sitio/component-utils/redirect.js', {target: card.path})
    })

  // cards that are absolute pages
  cards
    .filter(({listName, name}) => !listName && name[0] === '/')
    .forEach(card =>
      gen(card.name, 'sitio/component-utils/article.js', {
        html: md.render(card.desc)
      })
    )
}
