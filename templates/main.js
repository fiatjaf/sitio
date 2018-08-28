var React = require('react')
var render = require('react-dom').render
var createClass = require('create-react-class')
var createHistory = require('history').createBrowserHistory
var createHelmetStore = require('react-safety-helmet').createHelmetStore
var HelmetProvider = require('react-safety-helmet').HelmetProvider
var amd = require('micro-amd')()
var catchLinks = require('catch-links')

const {standaloneURL} = require(process.env.utils)

window.define = amd.define.bind(amd)
window.define.amd = true

const body = process.env.body

var history = createHistory({
  basename: ''
})

window.sitio = process.env.globals
window.sitio.history = history
window.sitio.utils = require(process.env.utils)
window.sitio.rootElement = document.body

window.sitio.Main = createClass({
  displayName: 'SitioMain',

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
        props.global = window.sitio

        self.setState({
          component: page.component,
          props: props
        })
      }, () => {
        console.log("> couldn't navigate, redirecting...")
        location.pathname = loc.pathname
      })
    })

    catchLinks(window.sitio.rootElement, function (href) {
      history.push(href)
    })
  },

  render: function () {
    var Body = require(body)

    return React.createElement(HelmetProvider, {store: this.props.helmetStore},
      React.createElement(Body, this.state.props,
        React.createElement(this.state.component, this.state.props)
      )
    )
  }
})

amd.require([standaloneURL(window.location.pathname)], function (page) {
  var props = page.props
  props.location = {
    pathname: window.location.pathname,
    search: ''
  }
  props.global = window.sitio

  render(React.createElement(window.sitio.Main, {
    helmetStore: createHelmetStore(),
    component: page.component,
    props: props
  }), window.sitio.rootElement)
})
