[![npm package](https://img.shields.io/npm/v/sitio.svg?style=flat-square)](https://www.npmjs.org/package/sitio)
![powered by browserify badge](https://img.shields.io/badge/powered%20by-browserify-blue.svg)
![webpack-free badge](https://img.shields.io/badge/webpack-free-orange.svg)

**sitio** is a static site generator that creates ultra fast and thin websites powered by [react](https://facebook.github.io/react/), so it supports isomorphic rendering and responsive clients.

## imperative

**sitio** is imperative, instead of declarative. Most static site generators expect you to arrange files in some structure and spread data around them in some predefined way. You may also have to declare properties, settings and metadata in multiple places, then you run a single command `generate-my-site` and get the resulting html files. **sitio** is different, you instead just write a script that tells it to generate such and such html pages with such and such data, but it also provides helpers so you can have multiple markdown files, for example, and easily loop through them.

## api

**sitio** provides 5 methods: `init`, `end`, `generatePage`, `copyStatic` and `listFiles`. `init` just prepares the directory for your static files; `listFiles(options)` gives you the list of files that may be of interest to your rendering process at given paths and glob patterns in general; `generatePage(pathname, componentPath, props)` generates a page at a given location with a given component and some props; `copyStatic(patternsArray)` copies static files to the site directory; and `end` finishes things up.

## quick tutorial

Here's a very simple site we can use **sitio** to generate. First we write a file `generate.js` with the following contents:

```javascript
# generate.js

const {init, end, generatePage} = require('sitio')

init()

generatePage('/', 'landing.js', {})
generatePage('/contact/', 'contact.js', {})

end()
```

The above expects a React component to be exported from `landing.js` and one from `contact.js`. It could be something like this:

```javascript
# landing.js

var React = require('react')

module.exports = function LandingPage () {
  return React.createElement('div', {}, 'Hello, visitor!')
}
```

```javascript
# contact.js

var React = require('react')

module.exports = function ContactPage () {
  return React.createElement('form', {method: 'post', action: 'https://formspree.io/me@myself.com'},
    React.createElement('input', {name: 'name', placeholder: 'type your name'}),
    React.createElement('button', {type: 'submit'}, 'Submit') 
  )
}
```

Besides that we'll need a file to define the parts of the site that will not change from page to page, which we'll call `body.js` and a file to define the contents of `<head>`, which we'll call `head.js` (they can't be in the same file because updating `<head>` with React is not straightforward, thus we forcibly use [react-helmet](https://github.com/nfl/react-helmet)).

```javascript
# body.js

var React = require('react')

module.exports = function Body (props) {
  var pathname = props.location.pathname // the special location property is passed to all components
  
  return React.createElement('div', {id: 'root'},
    React.createElement('ul', {},
      React.createElement('li', {},
        React.createElement('a', {href: '/'}, 'home')
      ),
      React.createElement('li', {},
        React.createElement('a', {href: '/contact/'}, 'contact')
      )
    ),
    React.createElement('header', {}, 'you are browsing the page ' + pathname),
    React.createElement('main', {}, props.children), // you must include props.children somewhere
    React.createElement('footer', {}, 'this site was generated with sitio'),
    React.createElement('script', {src: '/bundle.js'}) // you must include /bundle.js at the bottom
  )
}
```

```javascript
# head.js

var React = require('react')
var Helmet = require('react-helmet').default

module.exports = function Head (props) { 
  return React.createElement(Helmet, { 
    meta: [ 
      {charset: 'utf-8'},
      {httpEquiv: 'x-ua-compatible', content: 'ie: edge'},
      {name: 'description', content: 'nothing at all'},
      {name: 'viewport', content: 'width=device-width, height=device-height, initial-scale=1.0, user-scalable=yes'}
    ],
    title: props.location.pathname + ' at my test site',
    link: [],
    script: []
  })
}
```

Now, finally we can generate the site. You must call your `sitio` executable, which is probably at `./node_modules/.bin/sitio` if you installed it with `npm install sitio`. That executable is only necessary because it sets the `NODE_PATH` environment variable, then it just calls your `generate.js` directly.

```shell
sitio generate.js --body=body.js --helmet=head.js
```

Considering the directory structure given by the 5 files above, it will generate the following at `./_site`:

```
_site/
├── bundle.js
├── contact
│   ├── contact.js
│   └── index.html
├── index.html
└── index.js
```

What does it mean? If you browse to `/` you'll be served with `index.html`, which will then load `bundle.js`. After that point, every internal link you click, for example, `/contact/` will not load `contact/index.html`, but instead `contact/contact.js`, a really small JS file that contains just the props and metadata necessary to render the same DOM that is expressed in HTML form at `contact/index.html`. Because of this, browsing is almost instantaneous.

### making a markdown blog

Writing READMEs is wearing. I'll write this later, but basically you'll define a component to parse Markdown from the file contents with something like [gray-matter](https://www.npmjs.com/package/gray-matter) and call `generatePage()` for all your articles, listed with `listFiles(pattern: 'blog/**.md')`. `listFiles` will give you `{content, pathname, filepath}` and a bunch of other useful metadata about a file.

For a blog you should also write an index that shows all the pages, that's just another React component. You can pass to it just the names, dates and pathnames of the blog posts, or you can also, for example, extract summaries from the blogposts with [extract-summary](https://www.npmjs.com/package/extract-summary) and pass those too.

## faq

  * **Why is this better than writing my own single-page application with React?** Because you get static files, in HTML, that work for clients without Javascript. Also, you can use **sitio** as a single-page application generator, since you can use super complex components at any route you want, the benefit is that you won't need a full-featured backend server for routing, since every route will have an `index.html` there waiting to be served you can just use a static server.
  * **Why is this better than writing my own HTML pages manually?** Because you get the nice, fast and lightweight browsing that does not mess with your history.
  * **Why is this better than any other static site generator?** Because of the above, and also because you can use complex rendering logic in React components at specific routes in any way you want. Not only that, you can also code certain pages of your mostly static site to have interactive React components or any single-page application features you want, all this combined with Markdown rendering, for example.
  * **What goes in `bundle.js`?** Basically everything. Your `body` and `helmet` components, all `sitio` dependencies that must be used in client-side, all packages in the `.dependencies` of your `package.json`, all component files declared in `generatePage()` and their relative dependencies. `bundle.js` only needs to be loaded once (or you can opt to not load it at all,  if you just want a bare static site), so it is a good idea to include everything there and only some parameters in the dinamically loaded JS files corresponding to each different page of the site.
  * **What goes in each JS file corresponding to a page in the site?** Everything you pass to it in `generatePage()` (which will include, for example, full texts for blog posts) plus the name of the component that will be used to render it, also given in that function call. Since each of these pages may have lots of text contents, it doesn't make sense to include them all in a single bundle, as other React-based static site generators do. Loading them asynchronously is very fast since they come without HTML boilerplate.
  * **What if I want to use Babel, Buble or other preprocessors?** [browserify](https://github.com/substack/node-browserify) is used under the hood, and you can use [transforms](https://github.com/substack/node-browserify#browserifytransform) by specifying them in your `package.json`. Just remember that your code must be valid on Node.js, as it is run there to generate the static HTML before browserify transforms can do their job.
  * **What if I want to render content from different or external sources?** That's a great use case for **sitio**. If you have content hosted in a headless CMS, a Google Document, a Trello browser or who-knows-what, then you can just write JS code at your `generate.js` to fetch the content from there and call `generatePage()` with it.
  * **How do I write the site to a different directory?** Pass `--target-dir=./dir` to the executable or set the `TARGET_DIR` environment variable.
  * **What else can I configure?** Really, you want more?

## troubleshooting
  * **Everything is broken!** Sorry, I forgot to say that. Don't install `react` or `react-dom`. These are `sitio` dependencies and will be included by default. If you install them by your own horrible conflicts will happen. Please be aware that some bad React components installed from npm may depend explicitly on React and cause it to be installed too. Bad.
  * **My dependency is missing!** You must have a `package.json` with your dependencies listed at `.dependencies`. That's what happens when you install them with `npm install --save <depname>`.
  * **My site is being generated with sourcemaps!** This is not an error. It is a feature. If you want to turn it off pass `--production` to the executable. Or set the `PRODUCTION` environment variable.
