module.exports.standaloneURL = standaloneURL

function standaloneURL (pathname, isStatic) {
  var url
  if (pathname === '/') {
    url = '/index.js'
  } else {
    url = pathname + pathname.split('/').slice(-2)[0] + '.js'
  }

  if (!isStatic && process.env.NODE_ENV !== 'production') {
    url += '?t=' + Date.now()
  }

  return url
}
