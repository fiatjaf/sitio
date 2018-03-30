const dateFormat = require('dateformat')
const extract = require('extract-summary')
const slug = require('slug')
const md = require('markdown-it')({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true
})

module.exports.makePagination = function (gen, basepath, cards, page, options, extraProps) {
  let props = {
    ...extraProps,
    basepath,
    items: cards
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
        cover: card.cover,
        date: card.date,
        shortDate: card.shortDate,
        tags: card.labels
      })),
    page: page,
    prev: (page - 1).toString() || undefined,
    next: cards.length > (page * options.ppp)
      ? (page + 1).toString()
      : undefined
  }

  gen(`${basepath}/p/${page}/`, 'sitio/component-utils/list.js', props)

  if (page === 1) {
    gen(basepath, 'sitio/component-utils/list.js', props)
  }
}

module.exports.slugify = slugify
function slugify (name) {
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
    html: md.render(card.desc),
    data: {
      parentName: card.listName,
      name: card.name,
      date: card.date,
      cover: card.cover,
      prettyDate: card.prettyDate,
      tags: card.labels
    }
  }
}

module.exports.colors = {
  blue: '#0079B',
  green: '#61BD4F',
  orange: '#FFAB4A',
  red: '#EB5A46',
  yellow: '#F2D600',
  purple: '#C377E0',
  pink: '#FF80CE',
  sky: '#00C2E0',
  lime: '#51E898',
  shades: '#838C91'
}
