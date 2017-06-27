var React = require('react')
var renderToString = require('react-dom/server').renderToString
var Helmet = require('react-helmet').default
var e = React.createElement

var Main = function ReactSiteMain (props) {
  var Body = require(process.env.BODY)
  var makeHelmet = require(process.env.HELMET)

  return e(Body, props,
    e(makeHelmet, props),
    e(props.page, props)
  )
}

var output = renderToString(e(Main, {
  page: require(process.env.STANDALONE),
  meta: require(process.env.STANDALONE).meta,
  pages: JSON.parse(process.env.ALLPAGESMETA),
  location: {
    pathname: process.env.PATHNAME,
    search: ''
  }
}))
var head = Helmet.renderStatic()

process.stdout.write(
  '<!doctype html>' +
  '<html ' + head.htmlAttributes.toString() + '>' +
  '<head>' +
  head.meta.toString() +
  head.base.toString() +
  head.title.toString() +
  head.link.toString() +
  head.noscript.toString() +
  head.script.toString() +
  '</head>' +
  '<body>' + output + '</body>' +
  '</html>'
)
