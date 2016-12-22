var React = require('react')
var renderToString = require('react-dom/server').renderToString
var Helmet = require('react-helmet')
var e = React.createElement

var Main = React.createClass({
  displayName: 'ReactSiteMain',

  getInitialState () {
    return {
      location: {
        pathname: this.props.pathname,
        search: ''
      },
      page: this.props.page
    }
  },

  render () {
    var Body = require(process.env.BODY)
    var makeHelmet = require(process.env.HELMET)

    return e(Body, {
      location: this.props.location
    },
      makeHelmet(this.state),
      e(this.state.page, this.state)
    )
  }
})

var output = renderToString(React.createElement(Main, {
  page: require(process.env.STANDALONE),
  pathname: process.env.PATHNAME
}))

var head = Helmet.rewind()

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
  '<body><div id="react-mount">' + output + '</div></body>' +
  '</html>'
)
