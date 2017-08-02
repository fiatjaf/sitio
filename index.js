const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const glob = require('glob')
const copy = require('cp-file')
const React = require('react')
const ReactHelmet = require('react-helmet').default
const yargs = require('yargs')
const renderToString = require('react-dom/server').renderToString
const browserify = require('browserify')

const extract = require('./extract')

const targetdir = path.join(process.cwd(), '_site')
const defaultIgnore = [
  '**/node_modules/**',
  '**/.*',
  '_site/**',
  yargs.argv['$0'],
  yargs.argv.helmet,
  yargs.argv.body
]

module.exports.init = function (options) {
  options = options || {}
  rimraf.sync(path.join(targetdir, '*'))
  mkdirp.sync(targetdir)
}

module.exports.listFiles = function (options) {
  var {ignore} = options || {}
  ignore = ignore || []

  return glob.sync(
    '**/*.*(js|ts|jsx|tsx|md|html|txt|markdown|rst|text|text|latex|asciidoc)'
  , {
    ignore: defaultIgnore.concat(ignore)
  })
    .map(extract)
}

module.exports.generatePage = function (targetpath, componentpath, props) {
  console.log(`generating page at ${path.relative(process.cwd(), targetpath)} with ${componentpath} and props`)

  let Helmet = require(yargs.argv.helmet)
  let Body = require(yargs.argv.body)
  let Component = require(componentpath)

  let page = React.createElement(Body, props,
    React.createElement(Helmet, props),
    React.createElement(Component, props)
  )

  let output = renderToString(page)
  let head = ReactHelmet.renderStatic()
  let html = '<!doctype html>' +
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

  mkdirp.sync(path.dirname(targetpath))
  fs.writeFileSync(targetpath, html, {encoding: 'utf-8'})
}

module.exports.copyStatic = function (patterns) {
  patterns
    .map(p =>
      glob.sync(p, {ignore: defaultIgnore})
    )
    .map(staticFiles =>
      staticFiles.map(filepath => {
        console.log(`copying static file ${filepath}.`)
        copy.sync(
          path.join(process.cwd(), filepath),
          path.join(process.cwd(), '_site', filepath)
        )
      })
    )
}
