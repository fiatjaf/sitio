[![npm badge and link](https://nodei.co/npm/react-site.png?downloads=true)](https://npmjs.org/package/react-site)
![Webpack free](https://img.shields.io/badge/webpack-free-orange.svg)

This is a static website generator that uses [React](https://facebook.github.io/react/) and produces isomorphic websites that do **client-side routing and rendering**, which is fast; but also work as completely **static HTML pages** at any route, which is convenient; and also do not require your client to download the entire website content in a single `bundle.js`, which is great.

This magnificent task is accomplished through the hackish usage of fish shell, [browserify](https://github.com/substack/node-browserify), [catch-links](https://www.npmjs.com/package/catch-links), [AMD](https://github.com/QubitProducts/micro-amd) loading and some nasty browserify tricks (like the -r flag and `NODE_PATH` environment variable).

### What it does

Imagine you have a site structure like

```
.
├── about.html
├── articles
│   ├── and-you-and-i.md
│   ├── siberian-khatru.md
│   └── close-to-the-edge.md
├── content.js
├── helmet.js
├── index.js
├── makeWrapper.js
├── package.json
└── style.css
```

After you build the site, you'll get (under `./_site/`):

```
_site/
├── about
│   └── index.html  
├── about.js  
├── articles
│   ├── and-you-and-i
│   │   └── index.html
│   ├── and-you-and-i.js
│   ├── siberian-khatru
│   │   └── index.html
│   ├── siberian-khatru.js
│   ├── close-to-the-edge
│   │   └── index.html  
│   └── close-to-the-edge.js
├── articles.js  
├── bundle.js  
├── index.html
└── index.js
```

All the `.html` files are there for the first load at any route (you'll need `articles/index.whatever` if you want to show something at `/articles/`, but forget about it now). After that, every time the visitor click on an internal link, thethe code at `/bundle.js` will catch that event, push to the visitor's browser history and load the corresponding `.js` file for the new route.

Each `.js` file has only a small amount of code, basically the amount that the source file had. All `node_modules` dependencies (as declared in `package.json`) will be bundled only once at `/bundle.js`, including the wrapper, the helmet and the content file renderers.

### How to use

Install it with `npm install react-site` globally or locally in your site's directory. Then run it with `react-site build` (or `./node_modules/.bin/react-site build`). `react-site` expects your current directory to be the root of your site, and will save the built files under `./_site/`. It requires you to have 3 files/modules:

  - `head.js` (any filename with "head" or "helmet" will suffice) 
    - this file should `require('react-helmet')` and return a function that will receive props and return a Helmet.
    - this Helmet component is what will be used to make your website's static `<head>` and update it accordingly.
  - `app.js` (or any file that has "body", "content" or "main" in the name)
    - this file should export a React component that will draw the basic, static, site structure. Maybe you want a footer, a static header, whatever. You do it here. This will be rendered inside the first and only child of `<body>`, a `<div id="react-mount">`.
    - this file will receive some `this.props.children`, which you must render somewhere, because that is where all the action will happen.
    - this file also has the duty to include `/bundle.js`, the script that makes all the client-side things work. If you do not include this the website will be a pure static-HTML website of the 90's.
  - `wrapper.js` (actually any file that has "wrap" in its name, `makeWrapper.js` is probably better):
    - this file should export a function that takes an object `{filename, embedded}` and returns a React component (like those created with `React.createClass`) that will then receive props and should render the main view of the site.
    - this will be called for every page of the site, receiving a different {filename, embedded} combination for each.
      - `filename` is the name of file that is being rendered. You can determine the file type here and do different things if it is `.txt`, `.md`, `.html`, `.js`, whatever.
      - `embedded` is the content of the file. If it is a JS file it will be the JS module, as exported in `module.exports`, you know. If it is any other file it will be the raw file contents (text, mainly).
    - If it is an `.md` file, for example, you should parse frontmatter and markdown by yourself in this file.
  - `package.json`
    - this is needed because we look at the dependencies declared at `.dependencies` and bundle them all togetheron `bundle.js`. All dependencies that come with react-site are also bundled there (so you shouldn't have any `'react'`,  `'react-dom'` or whatever declared OR installed in your `node_modules`).

### External dependencies

If you do not have [fish shell](https://fishshell.com/) you can't use this (of course you can install it and replace your current shell with it -- or just install it to run the build script, that will work too, `sudo apt-get install fish-shell` or whatever).

The build script also needs [jq](https://stedolan.github.io/jq/manual/), the CLI tool that does magic with JSON. If you don't have it, you should, it will make your life better every time you must work with JSON, so please install it globally. `sudo apt-get install jq` should work.

For the live-rebuilding we require you to have [entr](http://entrproject.org/) which you can probably install with `sudo apt-get install entr` or similar command and Python for the web server. You already have Python.
