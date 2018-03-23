const dateFormat = require('dateformat')
const extract = require('extract-summary')
const slug = require('slug')

module.exports.makePagination = function (gen, basepath, cards, page, options, extraProps) {
  let cardsHere = cards
    .slice(
      (page - 1) * options.ppp,
      (page) * options.ppp
    )
    .map(card => ({
      path: card.path,
      name: card.name,
      excerpt: options.excerpts
        ? extract(card.desc, 'md')
        : '',
      shortLink: card.shortLink,
      date: card.date,
      cover: card.cover,
      shortDate: card.shortDate,
      labels: card.labels.map(l => l.name || l.id)
    }))

  let props = {
    ...extraProps,
    basepath,
    cards: cardsHere,
    prev: (page - 1).toString() || undefined,
    next: cards.length > (page * options.ppp)
      ? (page + 1).toString()
      : undefined
  }

  gen(`${basepath}/p/${page}/`, '../list-component.js', props)

  if (page === 1) {
    gen(basepath, '../list-component.js', props)
  }
}

module.exports.slugify = function (name) {
  return slug(name, {lower: true})
}

module.exports.fillWithDates = function (card) {
  let date = new Date(
    Date.parse(card.due) ||
      parseInt(card.id.slice(0, 8), 16) * 1000
  )

  card.date = date.toISOString()
  card.prettyDate = dateFormat(date, 'mmmm dS, yyyy')
  card.shortDate = dateFormat(date, 'd mmm yyyy')

  return card
}

module.exports.cardPageProps = function (card, extraProps = {}) {
  return {
    ...extraProps,
    listName: card.listName,
    slug: card.slug,
    name: card.name,
    desc: card.desc,
    date: card.date,
    cover: card.cover,
    prettyDate: card.prettyDate,
    labels: card.labels.map(l => ({
      name: l.name,
      slug: module.exports.slugify(l.name) || l.id,
      color: l.color
    }))
  }
}
