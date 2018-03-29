var React = require('react')
var render = require('react-dom').render
var createClass = require('create-react-class')
var createHistory = require('history').createBrowserHistory
var amd = require('micro-amd')()
var catchLinks = require('catch-links')

const {standaloneURL} = require(process.env.utils)

window.define = amd.define.bind(amd)
window.define.amd = true

const helmet = process.env.helmet
const body = process.env.body

var history = createHistory({
  basename: ''
})

window.reactSite = process.env.globals
window.reactSite.history = history
window.reactSite.utils = require(process.env.utils)
window.reactSite.rootElement = document.body

window.reactSite.Main = createClass({
  displayName: 'ReactSiteMain',

  getInitialState: function () {
    return {
      component: this.props.component,
      props: this.props.props
    }
  },

  componentDidMount: function () {
    var self = this

    history.listen(function (loc) {
      console.log('> navigating', loc.pathname)
      amd.require([standaloneURL(loc.pathname)], function (page) {
        var props = page.props
        props.location = loc
        props.global = window.reactSite

        self.setState({
          component: page.component,
          props: props
        })
      }, () => {
        console.log("> couldn't navigate, redirecting...")
        location.pathname = loc.pathname
      })
    })

    catchLinks(window.reactSite.rootElement, function (href) {
      history.push(href)
    })
  },

  render: function () {
    var Body = require(body)
    var Helmet = require(helmet)

    return React.createElement(Body, this.state.props,
      React.createElement(Helmet, this.state.props),
      React.createElement(this.state.component, this.state.props)
    )
  }
})

amd.require([standaloneURL(window.location.pathname)], function (page) {
  var props = page.props
  props.location = {
    pathname: window.location.pathname,
    search: ''
  }
  props.global = window.reactSite

  render(React.createElement(window.reactSite.Main, {
    component: page.component,
    props: props
  }), window.reactSite.rootElement)
})
