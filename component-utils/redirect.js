const React = require('react')
const Helmet = require('react-safety-helmet').default

module.exports = class extends React.Component {
  componentDidMount () {
    let origin = location.protocol + '//' + location.host
    if (this.props.target.slice(0, origin.length) === origin) {
      this.props.global.history.replace(this.props.target)
    } else {
      location.href = this.props.target
    }
  }

  render () {
    return React.createElement('p', {},
      React.createElement(Helmet, {},
        React.createElement('meta', {
          httpEquiv: 'refresh',
          content: `0; url=${this.props.target}`
        })
      ),
      React.createElement('a', {href: this.props.target}, 'Redirect')
    )
  }
}
