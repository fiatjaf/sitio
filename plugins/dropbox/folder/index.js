const puppeteer = require('puppeteer')
const fs = require('fs')
const fetch = require('node-fetch')
const matter = require('gray-matter')
const path = require('path')
const mkdirp = require('mkdirp')
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
    files
  }
}

module.exports = function (root, gen, {url}, staticdir, done) {
  getItems('/', url)
    .then(({htmls, files}) => {
      return Promise.all(
        htmls.map(([pathname, url]) =>
          Promise.all([
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
                pathname = pathname.endsWith('/index.html') || pathname.endsWith('/index.htm')
                  ? pathname.split('/').slice(0, -2).join('/')
                  : pathname.replace(/\.html?$/, '')

                gen(pathname, 'sitio/component-utils/html.js', {
                  html: md.render(content),
                  data
                })
              }),
            files.map(([pathname, url]) =>
              gen(pathname, 'sitio/component-utils/redirect.js', {target: url})
            )
          ])
        )
      )
    })
    .then(() => done(null))
    .catch(done)
}
