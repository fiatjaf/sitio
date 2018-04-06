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
const pretty = require('pretty')
var browserify
var incremental = false
try {
  browserify = require('browserify-incremental')
  incremental = true
} catch (e) {
  browserify = require('browserify')
}

const extract = require('./extract')
const {standaloneURL} = require('./utils')

const targetdirname = yargs.argv['target-dir'] || process.env.TARGET_DIR || '_site'
const targetdir = path.isAbsolute(targetdirname)
  ? targetdirname
  : path.join(process.cwd(), targetdirname)

const defaultPattern = '**/*.*(js|ts|jsx|tsx|md|html|txt|markdown|rst|text|text|latex|asciidoc)'
const defaultIgnore = [
  '**/node_modules/**',
  '**/.*',
  `${targetdirname}/**`,
  yargs.argv['$0'],
  yargs.argv.helmet,
  yargs.argv.body
]

var usedComponents = []

var globals = {
  baseURL: yargs.argv['base-url'] || process.env.BASE_URL || '',
  production: yargs.argv['production'] || process.env.PRODUCTION || false
}

module.exports.init = function (globalProps = {}) {
  // cleanup and prepare the _site directory
  rimraf.sync(path.join(targetdir, '*'))
  mkdirp.sync(targetdir)

  // setup global props
  for (let k in globalProps) {
    globals[k] = globalProps[k]
  }
}

module.exports.listFiles = function (options) {
  var {ignore} = options || {}
  ignore = ignore || []

  let pattern = options.pattern || defaultPattern

  return glob.sync(pattern, {
    ignore: defaultIgnore.concat(ignore)
  })
    .map(extract)
}

module.exports.plug = function (pluginName, rootPath, data, done) {
  console.log(`& plug(${pluginName}, ${rootPath}, ${Object.keys(data)
    .map(k => k + '=' + data[k])
    .join(', ')
  })`)

  let localtargetdir = path.join(targetdir, rootPath)
  mkdirp.sync(localtargetdir)

  let gen = function (pathsuffix, component, props) {
    generatePage(
      path.join(path.join(rootPath, pathsuffix)),
      path.join('node_modules', pluginName, component),
      props
    )
  }
  require(pluginName)(
    rootPath, // the path of the site this plugin controls
    gen, // wrapped version of generatePage
    data, // arbitrary data
    localtargetdir, // target dir for this plugin
    done // plugins are async, must call this with (err) when done
  )
}

module.exports.generatePage = generatePage
function generatePage (pathname, componentpath, props) {
  // first try to require needed components
  let s = componentpath.indexOf('sitio/')
  componentpath = s > 0 && componentpath[s - 1] === '/'
    ? componentpath.slice(s)
    : componentpath

  let Component = require(componentpath)
  usedComponents.push(componentpath)

  let Helmet = require(yargs.argv.helmet)
  let Body = require(yargs.argv.body)

  if (pathname[0] !== '/') pathname = '/' + pathname
  if (pathname[pathname.length - 1] !== '/') pathname = pathname + '/'

  console.log(`> generatePage(${pathname}, ${componentpath}, ${typeof props === 'object'
    ? Object.keys(props).map(k => `${k}=${typeof props[k] === 'string'
      ? props[k].slice(0, 5).replace('\n', '\\n') + (props[k].length > 5 ? '…' : '')
      : props[k] === null
        ? 'null'
        : typeof props[k] === 'object'
          ? Array.isArray(props[k])
            ? `[…]${props[k].length}`
            : `{…}${Object.keys(props[k]).length}`
          : props[k]
    }`).join(', ')
    : props
  })`)
  let targetpath = path.join(targetdir, pathname, 'index.html')

  let staticprops = Object.assign({
    location: {
      pathname,
      search: ''
    },
    global: globals
  }, props)

  /* generating static HTML */
  let page = React.createElement(Body, staticprops,
    React.createElement(Helmet, staticprops),
    React.createElement(Component, staticprops)
  )

  let head = ReactHelmet.renderStatic()
  var html = '<!doctype html>' +
  '<html ' + head.htmlAttributes.toString() + '>' +
    '<head>' +
      head.meta.toString() +
      head.base.toString() +
      head.title.toString() +
      head.link.toString() +
      head.noscript.toString() +
      head.script.toString() +
    '</head>' +
    '<body>' +
      renderToString(page) +
    '</body>' +
  '</html>'

  if (!globals.production) {
    html = pretty(html)
  }

  mkdirp.sync(path.dirname(targetpath))
  fs.writeFileSync(targetpath, html, {encoding: 'utf-8'})
  /* --- */

  /* generating standalone JS file */
  let b = browserify(path.join(__dirname, '/templates/standalone.js'), {
    standalone: 'doesntmatter',
    ignoreMissing: true,
    bundleExternal: false,
    paths: process.env.NODE_PATH.split(':'),
    debug: !globals.production
  })
  b.external(componentpath)
  b.transform(
    'envify',
    {props, componentpath}
  )
  let br = b.bundle()

  let targetjs = path.join(targetdir, standaloneURL(pathname))
  let w = fs.createWriteStream(targetjs, {encoding: 'utf-8'})
  br.pipe(w)
  br.on('end', () =>
    w.end(process.exit)
  )
  /* --- */
}

module.exports.copyStatic = function (patterns) {
  patterns
    .map(p =>
      glob.sync(p, {ignore: defaultIgnore})
    )
    .map(staticFiles =>
      staticFiles.map(filepath => {
        console.log(`# copyStatic(${filepath})`)
        copy.sync(
          path.join(process.cwd(), filepath),
          path.join(targetdir, filepath)
        )
      })
    )
}

module.exports.end = function () {
  console.log('(i) generating the JS bundle that puts everything together.')

  var pageExternalPackages = []
  try {
    pageExternalPackages = Object.keys(
      require(path.join(process.cwd(), 'package.json')).dependencies
    )
  } catch (e) {
    console.error('(!) error getting package dependencies names.', e)
  }

  console.log('(i) passing', [path.join(__dirname, 'utils'), yargs.argv.body, yargs.argv.helmet], 'to browserify' + (incremental ? 'inc' : '') + '.')

  let b = browserify(path.join(__dirname, '/templates/main.js'), {
    paths: process.env.NODE_PATH.split(':'),
    debug: !globals.production
  })

  b.transform(
    'envify',
    {
      utils: path.join(__dirname, 'utils'),
      body: yargs.argv.body,
      helmet: yargs.argv.helmet,
      globals: globals
    }
  )
  b.require([
    'react',
    'react-dom',
    'react-helmet',
    'history',
    'catch-links',
    'micro-amd',
    path.join(__dirname, 'utils')
  ])
  b.require(pageExternalPackages)
  b.require(yargs.argv.helmet)
  b.require(yargs.argv.body)
  b.require(usedComponents)
  let br = b.bundle()

  console.log('(i) writing the result to bundle.js')
  let w = fs.createWriteStream(path.join(targetdir, 'bundle.js'), {encoding: 'utf-8'})
  br.pipe(w)
  br.on('end', () =>
    w.end(process.exit)
  )
  br.on('error', err => console.error(err))
}
