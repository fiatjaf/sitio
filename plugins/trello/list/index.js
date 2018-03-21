const Trello = require('node-trello')
const extract = require('extract-summary')
const slug = require('slug')
const dateFormat = require('dateformat')
const parallel = require('run-parallel')

const slugify = x => slug(x, {
  lower: true
})

module.exports = function (root, gen, {
  ref,
  apiKey,
  apiToken,
  postsPerPage = 7,
  excerpts = true
}, staticdir, done) {
  const t = new Trello(apiKey, apiToken)
  const listId = ref
  const ppp = postsPerPage

  parallel([
    done => t.get(`/1/lists/${listId}/cards`, {
      fields: 'name,desc,due,shortLink,labels',
      attachments: 'cover',
      attachment_fields: 'url',
      checklists: 'all',
      checkItemStates: true,
      members: true,
      member_fields: 'username,avatarHash'
    }, done),
    done => t.get(`/1/lists/${listId}`, {fields: 'idBoard,name'}, done)
  ], (err, results) => {
    if (err) {
      console.error(`couldn't fetch cards from list ${listId}.`, err)
      return
    }

    let [cards, {_, name}] = results

    cards = cards
      .filter(({name}) => name[0] !== '_')
      .filter(({name}) => name[0] !== '#')

    cards.forEach(card => {
      card.slug = slugify(card.name)

      let date = new Date(
        Date.parse(card.due) ||
          parseInt(card.id.slice(0, 8), 16) * 1000
      )
      card.date = date.toISOString()
      card.prettyDate = dateFormat(date, 'mmmm dS, yyyy')
      card.shortDate = dateFormat(date, 'd mmm yyyy')
      card.cover = card.attachments ? card.attachments[0].url : null
    })

    let cardSummaries = cards.map(card => ({
      idList: card.idList,
      slug: card.slug,
      name: card.name,
      excerpt: excerpts ? extract(card.desc, 'md') : '',
      shortLink: card.shortLink,
      date: card.date,
      cover: card.cover,
      shortDate: card.shortDate,
      labels: card.labels.map(l => l.name || l.id)
    }))

    // list page and /p/ afterwards
    let list = {
      name: name,
      slug: slugify(name)
    }

    function makePage (page, url) {
      url = url || `/p/${page}/`
      gen(url, '../list-component.js', {
        root,
        name: list.name,
        slug: list.slug,
        cards: cardSummaries.slice(
          (page - 1) * ppp,
          (page) * ppp
        ),
        prev: page - 1 || undefined,
        next: cardSummaries.length > page * ppp
          ? page + 1
          : undefined
      })
    }

    var page = 1
    while ((page - 1) * ppp < cards.length) {
      makePage(page)
      page++
    }

    makePage(1, '/')

    // each card page
    cards
      .map(card => {
        gen(`/${card.slug}/`, '../card-component.js', {
          listURL: root,
          shortLink: card.shortLink,
          listName: list.name,
          slug: card.slug,
          name: card.name,
          desc: card.desc,
          date: card.date,
          cover: card.cover,
          prettyDate: card.prettyDate,
          labels: card.labels.map(l => ({
            name: l.name,
            slug: slugify(l.name) || l.id,
            color: l.color
          }))
        })
      })
  }, done)
}
