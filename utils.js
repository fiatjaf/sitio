module.exports.standaloneURL = standaloneURL

function standaloneURL (pathname) {
  var url
  if (pathname === '/') {
    url = '/index.js'
  } else {
    url = pathname + pathname.split('/').slice(-2)[0] + '.js'
  }

  if (typeof window !== 'undefined') {
    if (!window.reactSite.production) {
      url += '?t=' + Date.now()
    }

    url = window.reactSite.baseURL + url
  }

  return url
}
