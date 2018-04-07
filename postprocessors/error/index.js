module.exports = async function (gen, pages, data, targetdir) {
  let path = data.path || 'error'

  var html = "<p>Sorry, this page doesn't exist! This site has the following pages, please see if any of those is what you were searching:"
  html += '<ul>'

  pages = pages.sort((a, b) =>
    (a.props.data && a.props.data.name || '~') + ':' + a.pathname <
    (b.props.data && b.props.data.name || '~') + ':' + b.pathname
      ? -1
      : 1
  )

  for (let i = 0; i < pages.length; i++) {
    let {pathname, componentpath: _, props} = pages[i]
    html += `
<li>
  <a href="${pathname}">${pathname}</a>: ${props.data && props.data.name || ''}
</li>
    `
  }
  html += '</ul>'

  gen(path, 'sitio/component-utils/article.js', {
    html,
    data: {
      isFullArticle: true
    }
  })
}
