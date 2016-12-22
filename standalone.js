var makeWrapper = require(process.env.WRAPPER)

module.exports = makeWrapper({
  filename: process.env.EMBED,
  embedded: require(process.env.EMBED)
})
