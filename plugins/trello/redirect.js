const React = require('react')
const Helmet = require('react-helmet').default

module.exports = class extends React.Component {
  componentDidMount () {
    this.props.global.history.replace(this.props.target)
  }

  render () {
    return React.createElement('p', {},
      React.createElement(Helmet, {
        meta: [{
          httpEquiv: 'refresh',
          content: `0; url=${this.props.target}`
        }]
      }, []),
      React.createElement('a', {href: this.props.target}, 'Redirect')
    )
  }
}
