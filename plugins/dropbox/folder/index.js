const puppeteer = require('puppeteer')
const fs = require('fs')
const fetch = require('node-fetch')
const matter = require('gray-matter')
const path = require('path')
const dateFormat = require('dateformat')
const mkdirp = require('mkdirp')
const extract = require('extract-summary')
const hashbow = require('hashbow')
const md = require('markdown-it')({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true
})

async function getItems (currentpath, nexturl) {
  let browser = await puppeteer.launch()
  let page = await browser.newPage()
  await page.goto(nexturl)

  let {htmls, files, folders} = await page.evaluate(() => {
    let els = document.querySelectorAll('.sl-link')
    var htmls = []
    var files = []
    var folders = []
    for (let i = 0; i < els.length; i++) {
      let el = els[i]
      var container

      if (el.classList.contains('sl-link--folder')) {
        container = folders
      } else if (el.classList.contains('sl-link--file')) {
        let ext = el.title.split('.').slice(-1)[0]
        if (ext === 'md' || ext === 'markdown' || ext === 'html' || ext === 'htm') {
          container = htmls
        } else {
          container = files
        }
      }
      container.push([el.title, el.href])
    }

    return {htmls, files, folders}
  })

  let folderName = await page.title()
  await browser.close()

  let prefix = ([name, url]) => [path.join(currentpath, name), url]
  htmls = htmls.map(prefix)
  files = files.map(prefix)
  folders = folders.map(prefix)

  for (let i = 0; i < folders.length; i++) {
    let [name, url] = folders[i]
    let {
      htmls: nestedHTMLs,
      files: nestedFiles
    } = await getItems(name, url)
    htmls = htmls.concat(nestedHTMLs)
    files = files.concat(nestedFiles)
  }

  return {
    htmls,
    files,
    folderName
  }
}

module.exports = function (root, gen, {
  url,
  excerpts = true,
  postsPerPage = 7
}, staticdir, done) {
  const ppp = postsPerPage

  getItems('/', url)
    .then(({htmls, files, folderName}) => {
      return Promise.all([
        Promise.all(htmls.map(([pathname, url]) =>
          fetch(url.replace('dl=0', 'dl=1'), {redirect: 'follow'})
            .then(r => r.text())
            .then(text => {
              if (text.toLowerCase().indexOf('<!doctype') !== -1) {
                let pathtarget = path.join(staticdir, pathname)
                mkdirp.sync(path.dirname(pathtarget))
                return fs.writeFileSync(pathtarget, text)
              }

              let {content, data} = matter(text)
              pathname = pathname.replace(/\.(md|markdown)$/, '.html')
              pathname = (pathname.endsWith('/index.html') ||
                          pathname.endsWith('/index.htm'))
                ? pathname.split('/').slice(0, -2).join('/')
                : pathname.replace(/\.html?$/, '')

              let doc = {
                data,
                html: md.render(content)
              }

              doc.data.parentName = folderName
              doc.data.tags = (doc.data.tags || [])
                .concat(
                  path.dirname(pathname).split('/')
                    .filter(t => t !== '.' && t !== '..')
                )
                .filter(tagName => tagName)
                .map(tagName => ({
                  name: tagName,
                  color: hashbow(tagName, 50, 75)
                }))

              doc.data.name = data.title || data.name || path.basename(pathname)
              doc.data.cover = data.cover || data.header
              doc.path = pathname

              if (doc.data.date) {
                let date = new Date(Date.parse(data.date))
                doc.data.date = date.toISOString()
                doc.data.shortDate = dateFormat(date, 'd mmm yyyy')
              }

              gen(pathname, 'sitio/component-utils/article.js', {
                ...doc,
                root
              })

              return doc
            })
        )),
        files.map(([pathname, url]) =>
          gen(pathname, 'sitio/component-utils/redirect.js', {target: url})
        )
      ])
      .then(([documents]) =>
        documents.filter(x => x)
      )
      .then(documents => {
        // normal, date-sorted pagination
        documents = documents.sort((a, b) => a.data.date < b.data.date ? -1 : 1)
        console.log('DOCUMENTS', documents.map(d => [d.data.name, d.path]))

        var page = 1
        while ((page - 1) * ppp < documents.length) {
          makePagination(gen, '/', documents, page, {ppp, excerpts}, {
            name: folderName,
            root
          })
          page++
        }

        // tag-based pagination
        var byTag = documents.reduce((acc, doc) => {
          if (!doc.data.tags) return acc
          return doc.data.tags.reduce((acc, {name: tagName}) => {
            acc[tagName] = acc[tagName] || []
            acc[tagName].push(doc)
            return acc
          }, acc)
        }, {})

        for (let tagName in byTag) {
          let documents = byTag[tagName]
          var tpage = 1
          while ((tpage - 1) * ppp < documents.length) {
            makePagination(gen, `/tag/${tagName}/`, documents, tpage, {ppp, excerpts}, {
              name: tagName,
              root
            })
            tpage++
          }
        }
      })
    })
    .then(() => done(null))
    .catch(done)
}

function makePagination (gen, basepath, items, page, options, extraProps) {
  let props = {
    ...extraProps,
    basepath,
    items: items
      .slice(
        (page - 1) * options.ppp,
        (page) * options.ppp
      )
      .map(item => ({
        path: item.path,
        name: item.data.name,
        excerpt: item.data.excerpt || options.excerpts
          ? extract(item.html, 'md')
          : '',
        cover: item.data.cover,
        date: item.data.date,
        shortDate: item.data.shortDate,
        tags: item.data.tags
      })),
    page: page,
    prev: (page - 1).toString() || undefined,
    next: items.length > (page * options.ppp)
      ? (page + 1).toString()
      : undefined
  }

  gen(`${basepath}/p/${page}/`, 'sitio/component-utils/list.js', props)

  if (page === 1) {
    gen(basepath, 'sitio/component-utils/list.js', props)
  }
}
