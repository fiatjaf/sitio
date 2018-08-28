/** @format */

module.exports.standaloneURL = standaloneURL

function standaloneURL(pathname) {
  if (pathname[pathname.length - 1] !== '/') pathname = pathname + '/'

  var url
  if (pathname === '/') {
    url = '/index.js'
  } else {
    url = pathname + pathname.split('/').slice(-2)[0] + '.js'
  }

  if (typeof window !== 'undefined') {
    if (!window.sitio.production) {
      url += '?t=' + Date.now()
    }

    url = window.sitio.baseURL + url
  }

  return url
}
