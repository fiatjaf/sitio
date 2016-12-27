var makeWrapper = require(process.env.WRAPPER)

var meta = JSON.parse(process.env.META)
var content = require(process.env.CONTENTPATH)

module.exports = makeWrapper(meta, content)
module.exports.meta = meta
