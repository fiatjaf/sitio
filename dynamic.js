var React = require('react')
var render = require('react-dom').render
var e = React.createElement
var createHistory = require('history').createHistory
var amd = require('micro-amd')()
var catchLinks = require('catch-links')

window.define = amd.define.bind(amd)
window.define.amd = true

var history = createHistory({
  basename: ''
})

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

  componentDidMount () {
    history.listen(function (location) {
      console.log('> navigating', location.pathname)
      amd.require([location.pathname + 'index.js'], function (page) {
        this.setState({
          location: location,
          child: page
        })
      }.bind(this))
    }.bind(this))

    catchLinks(document.body, function (href) {
      history.push(href)
    })
  },

  render () {
    var Body = require(process.env.BODY)
    var makeHelmet = require(process.env.HELMET)

    return e('body', null,
      e(Body, {
        location: this.props.location
      },
        makeHelmet(this.state),
        this.state.page
      )
    )
  }
})

amd.require([window.location.pathname + 'index.js'], function (page) {
  render(React.createElement(Main, {
    page: page,
    pathname: window.location.pathname
  }), document.body)
})