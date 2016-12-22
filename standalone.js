var React = require('react')
var Wrapper = require(process.env.WRAPPER)

module.exports = React.createElement(Wrapper, {
  filename: process.env.EMBED,
  embedded: require(process.env.EMBED)
}, null)
