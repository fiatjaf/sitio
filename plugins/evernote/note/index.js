const puppeteer = require('puppeteer')
const path = require('path')

module.exports = function (root, gen, {url}, staticdir, done) {
  getNoteData(url, staticdir)
    .then(({title, date, content}) => {
      gen('/', 'sitio/component-utils/html.js', {
        props: {title, date},
        html: content
      })
    })
    .then(() => done())
    .catch(done)
}

async function getNoteData (sharedURL, staticdir) {
  try {
    let browser = await puppeteer.launch()
    let page = await browser.newPage()
    await page.goto(sharedURL)
    let {title, date, contentURL} = await page.evaluate(() => {
      return {
        title: document.querySelector('#container-boundingbox .header h1').innerText,
        date: document.querySelector('#container-boundingbox .header span').innerText,
        contentURL: document.getElementById('note-content-iframe').src
      }
    })

    var child
    var frames = page.mainFrame().childFrames()
    for (let i = 0; i < frames.length; i++) {
      if (frames[i].url() === contentURL) {
        child = frames[i]
        break
      }
    }
    await child.waitForSelector('#note-frame-body', {timeout: 4000})

    let {content, images} = await child.evaluate(() => {
      let body = document.getElementById('note-frame-body')
      let imgs = body.querySelectorAll('img')
      var images = []

      for (let i = 0; i < imgs.length; i++) {
        let img = imgs[i]
        let filename = `image${i}.png`
        images.push([img.src, filename])
        img.src = filename
      }

      return {
        content: document.getElementById('note-frame-body').innerHTML,
        images
      }
    })

    for (let i = 0; i < images.length; i++) {
      let [url, filename] = images[i]
      await page.goto(url)
      await page.screenshot({
        path: path.join(staticdir, filename),
        omitBackground: true,
        fullPage: true
      })
    }

    await browser.close()
    return {title, date, content}
  } catch (e) {
    console.error('error scraping', sharedURL, e)
  }
}
