const React = require('react')

module.exports = function ({html, data}) {
  if (!data || Object.keys(data).length === 0) {
    return React.createElement('article', {
      dangerouslySetInnerHTML: {__html: html}
    })
  }

  return (
    React.createElement('article', {}, [
      React.createElement('header', {}, [
        React.createElement('h1', {}, [
          React.createElement('a', {rel: 'bookmark', href: ''}, data.title)
        ]),
        React.createElement('aside', {}, [
          React.createElement('time', {dateTime: data.date}, data.date)
        ])
      ]),
      React.createElement('div', {
        dangerouslySetInnerHTML: {__html: html}
      })
    ])
  )
}
