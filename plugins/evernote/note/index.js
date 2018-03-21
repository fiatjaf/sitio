const puppeteer = require('puppeteer')

module.exports = function (root, gen) {
  let {title, date, content} = getNoteData(root)

  gen('/', '../note-component.js', {root, title, date, content})
}

async function getNoteData (sharedURL) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
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

  let content = await child.evaluate(() =>
    document.getElementById('note-frame-body').innerHTML
  )

  await browser.close()

  return {title, date, content}
}
