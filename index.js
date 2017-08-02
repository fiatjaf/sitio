#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')
const glob = require('glob')
const browserify = require('browserify')

const extract = require('./extract')

require('yargs')
  .command('build', 'builds the site at the current directory, saves the output at ./_site/',
    (yargs) => {},
    (argv) => {
      function log () { if (argv.verbose) console.log.apply(console, arguments) }

      log('reading configuration file')
      let pkgjson = fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
      const meta = JSON.parse(pkgjson)['react-site']

      const body = path.join(process.cwd(), meta['body'])
      const helmet = path.join(process.cwd(), meta['helmet'])
      const wrapper = path.join(process.cwd(), meta['wrapper'])

      const Body = require(body)
      const Helmet = require(helmet)
      const Wrapper = require(wrapper)

      const filestobuild = glob.sync('**/*.*(md|html|txt|markdown|rst|text|text|latex|asciidoc)', {
        ignore: [
          '**/node_modules/**',
          '**/.*',
          '_site/**',
          meta['body'],
          meta['helmet'],
          meta['wrapper']
        ].concat(meta['build-ignore'])
      })

      const staticfiles = meta['static']
        .map(pattern => glob.sync(pattern))
        .reduce((acc, n) => acc.concat(n), [])

      const target = path.join(process.cwd(), '_site/')

      log('body:', body)
      log('helmet:', helmet)
      log('wrapper:', wrapper)
      log('filestobuild:', filestobuild)
      log('staticfiles:', staticfiles)
      log('target:', target)

      log('resetting or creating ' + target + ' if it does not exist')
      mkdirp.sync(target)

      log('extracting data from files')
      var alldata = {}
      for (let i = 0; i < filestobuild.length; i++) {
        let filepath = filestobuild[i]
        var data = extract(filepath)
        data = extract.preprocess(data)
        alldata[filepath] = data
      }

      log('making standalone bundles for all pages (to be loaded asynchronously) and putting those on $target at the same time creating the static html for each page.')
      for (let i = 0; i < filestobuild.length; i++) {
        let filepath = filestobuild[i]
        let data = alldata[filepath]
        b = browserify()
        b.add(filepath, {bundleExternal: false})
        b.transform(file => {
          var data = ''
          return through(write, end)
          
        })
        b.exclude(wrapper)
      }
    })
  .option('verbose', {
    alias: 'v',
    default: false
  })
  .argv
