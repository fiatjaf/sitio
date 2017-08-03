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

window.reactSite = process.env.globals

const rootElement = document.getElementById('react-site')

var history = createHistory({
  basename: ''
})

var Main = createClass({
  displayName: 'ReactSiteMain',

  getInitialState: function () {
    return {
      component: this.props.component,
      props: this.props.props
    }
  },

  componentDidMount: function () {
    var self = this

    history.listen(function (location) {
      console.log('> navigating', location.pathname)
      amd.require([standaloneURL(location.pathname)], function (page) {
        var props = page.props
        props.location = location

        self.setState({
          component: page.component,
          props: props
        })
      })
    })

    catchLinks(rootElement, function (href) {
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

  render(React.createElement(Main, {
    component: page.component,
    props: props
  }), rootElement)
})
