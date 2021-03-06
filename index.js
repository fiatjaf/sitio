/** @format */

const fs = require('fs')
const util = require('util')
const path = require('path')
const rimraf = require('rimraf')
const flatten = require('flatten')
const mkdirp = require('mkdirp')
const glob = require('glob')
const copy = require('cp-file')
const React = require('react')
const {HelmetProvider, createHelmetStore} = require('react-safety-helmet')
const yargs = require('yargs')
const renderToString = require('react-dom/server').renderToString
const pretty = require('pretty')
const browserify = require('browserify')

const extract = require('./extract')
const {standaloneURL} = require('./utils')

module.paths = [
  path.join(path.resolve(__dirname), 'node_modules'),
  process.cwd(),
  path.join(process.cwd(), 'node_modules')
]

const targetdirname =
  yargs.argv['target-dir'] || process.env.TARGET_DIR || '_site'
const targetdir = path.isAbsolute(targetdirname)
  ? targetdirname
  : path.join(process.cwd(), targetdirname)

const defaultPattern =
  '**/*.*(js|ts|jsx|tsx|md|html|txt|markdown|rst|text|text|latex|asciidoc)'
const defaultIgnore = [
  '**/node_modules/**',
  '**/.*',
  `${targetdirname}/**`,
  yargs.argv['$0'],
  yargs.argv.body
]

var usedComponents = {}

var globals = {
  baseURL: yargs.argv['base-url'] || process.env.BASE_URL || '',
  production: yargs.argv['production'] || process.env.PRODUCTION || false
}

var generatedPages = []

module.exports.init = async function(globalProps = {}) {
  // cleanup and prepare the _site directory
  await util.promisify(rimraf)(path.join(targetdir, '*'))
  await util.promisify(mkdirp)(targetdir)

  // setup global props
  for (let k in globalProps) {
    globals[k] = globalProps[k]
  }
}

module.exports.listFiles = async function(options) {
  var {ignore} = options || {}
  ignore = ignore || []

  let pattern = options.pattern || defaultPattern

  let fileslist = await util.promisify(glob)(pattern, {
    ignore: defaultIgnore.concat(ignore)
  })

  return fileslist.map(extract)
}

module.exports.plug = async function(pluginName, rootPath, data) {
  console.log(
    `& plug(${pluginName}, ${rootPath}, ${Object.keys(data)
      .map(k => k + '=' + data[k])
      .join(', ')})`
  )

  let localtargetdir = path.join(targetdir, rootPath)
  await util.promisify(mkdirp)(localtargetdir)

  let gen = async function(pathsuffix, component, props) {
    await generatePage(
      path.join(path.join(rootPath, pathsuffix)),
      path.join('node_modules', pluginName, component),
      props
    )
  }

  var plugin
  try {
    plugin = require(path.join(process.cwd(), 'node_modules', pluginName))
  } catch (e) {
    plugin = require(pluginName)
  }

  await plugin(
    rootPath, // the path of the site this plugin controls
    gen, // wrapped version of generatePage
    data, // arbitrary data
    localtargetdir // target dir for this plugin
  )
}

module.exports.postprocess = async function(pluginName, data = {}) {
  console.log(
    `~ postprocess(${pluginName}, ${Object.keys(data)
      .map(k => k + '=' + data[k])
      .join(', ')})`
  )

  var plugin
  try {
    plugin = require(path.join(process.cwd(), 'node_modules', pluginName))
  } catch (e) {
    plugin = require(pluginName)
  }

  await plugin(
    (pt, cp, pr) => generatePage(pt, cp, pr, true),
    generatedPages,
    data,
    targetdir // the root target dir for the site (_site/, for example)
  )
}

module.exports.generatePage = generatePage
async function generatePage(
  pathname,
  componentpath,
  props,
  skipGeneratedPagesList
) {
  props = props || {}
  var waiting = []

  // first try to require needed components
  let s = componentpath.indexOf('sitio/')
  componentpath =
    s > 0 && componentpath[s - 1] === '/'
      ? componentpath.slice(s)
      : componentpath

  let Component = require(componentpath)
  usedComponents[componentpath] = true

  let Body = require(yargs.argv.body)

  if (pathname[0] !== '/') pathname = '/' + pathname
  if (pathname[pathname.length - 1] !== '/') pathname = pathname + '/'

  // add this page along with props and everything to the list that will be
  // postprocessed on end()
  if (!skipGeneratedPagesList) {
    generatedPages.push({pathname, componentpath, props})
  }

  console.log(
    `> generatePage(${pathname}, ${componentpath}, ${
      typeof props === 'object'
        ? Object.keys(props)
            .map(
              k =>
                `${k}=${
                  typeof props[k] === 'string'
                    ? props[k].slice(0, 5).replace('\n', '\\n') +
                      (props[k].length > 5 ? '…' : '')
                    : props[k] === null
                      ? 'null'
                      : typeof props[k] === 'object'
                        ? Array.isArray(props[k])
                          ? `[…]${props[k].length}`
                          : `{…}${Object.keys(props[k]).length}`
                        : props[k]
                }`
            )
            .join(', ')
        : props
    })`
  )
  let targetpath = path.join(targetdir, pathname, 'index.html')

  let staticprops = Object.assign(
    {
      location: {
        pathname,
        search: ''
      },
      global: globals
    },
    props
  )

  /* generating static HTML */
  let helmetStore = createHelmetStore()
  let page = React.createElement(
    HelmetProvider,
    {store: helmetStore},
    React.createElement(
      Body,
      staticprops,
      React.createElement(Component, staticprops)
    )
  )

  let body = renderToString(page)
  let head = helmetStore.renderStatic()

  var html =
    '<!doctype html>' +
    '<html ' +
    head.htmlAttributes.toString() +
    '>' +
    '<head>' +
    head.meta.toString() +
    head.base.toString() +
    head.title.toString() +
    head.link.toString() +
    head.noscript.toString() +
    head.script.toString() +
    '</head>' +
    '<body ' +
    head.bodyAttributes.toString() +
    '>' +
    body +
    '</body>' +
    '</html>'

  if (!globals.production) {
    html = pretty(html)
  }

  await util.promisify(mkdirp)(path.dirname(targetpath))

  waiting.push(
    new Promise((resolve, reject) => {
      fs.writeFile(targetpath, html, {encoding: 'utf-8'}, err => {
        if (err) return reject(err)
        resolve()
      })
    })
  )
  /* --- */

  /* generating standalone JS file */
  let b = browserify(path.join(__dirname, '/templates/standalone.js'), {
    standalone: 'doesntmatter',
    ignoreMissing: true,
    bundleExternal: false,
    paths: module.paths,
    debug: !globals.production
  })
  b.external(componentpath)
  b.transform('envify', {props, componentpath})
  let br = b.bundle()

  let targetjs = path.join(targetdir, standaloneURL(pathname))
  let w = fs.createWriteStream(targetjs, {encoding: 'utf-8'})
  br.pipe(w)

  waiting.push(
    new Promise((resolve, reject) => {
      br.on('end', err => {
        if (err) return reject(err)

        w.end(process.exit)
        resolve()
      })
      b.on('error', reject)
      br.on('error', reject)
    })
  )
  /* --- */

  return Promise.all(waiting)
}

module.exports.copyStatic = async function(patterns) {
  let promisesForPatterns = patterns
    .map(p => glob.sync(p, {ignore: defaultIgnore}))
    .map(staticFiles =>
      staticFiles.map(filepath => {
        console.log(`# copyStatic(${filepath})`)
        copy.sync(
          path.join(process.cwd(), filepath),
          path.join(targetdir, filepath)
        )
      })
    )

  return Promise.all(flatten(promisesForPatterns))
}

module.exports.end = async function() {
  console.log('(i) generating the JS bundle that puts everything together.')

  var pageExternalPackages = []
  try {
    pageExternalPackages = Object.keys(
      require(path.join(process.cwd(), 'package.json')).dependencies
    )
  } catch (e) {
    console.error('(!) error getting package dependencies names.', e)
  }

  console.log(
    '(i) passing',
    [path.join(__dirname, 'utils'), yargs.argv.body],
    'to browserify.'
  )

  let b = browserify(path.join(__dirname, '/templates/main.js'), {
    paths: module.paths,
    debug: !globals.production
  })

  b.transform('envify', {
    utils: path.join(__dirname, 'utils'),
    body: yargs.argv.body,
    globals: globals
  })
  b.require([
    'react',
    'react-dom',
    'react-safety-helmet',
    'history',
    'catch-links',
    'micro-amd',
    path.join(__dirname, 'utils')
  ])
  b.require(pageExternalPackages)
  b.require(yargs.argv.body)
  b.require(Object.keys(usedComponents))

  let br = b.bundle()

  console.log('(i) writing the result to bundle.js')
  let w = fs.createWriteStream(path.join(targetdir, 'bundle.js'), {
    encoding: 'utf-8'
  })
  br.pipe(w)

  return new Promise((resolve, reject) => {
    br.on('end', err => {
      if (err) return reject(err)

      w.end(process.exit)
      resolve()
    })
    b.on('error', reject)
    br.on('error', reject)
  })
}
