[![npm package](https://img.shields.io/npm/v/react-site.svg?style=flat-square)](https://www.npmjs.org/package/react-site)
![Webpack-free badge](https://img.shields.io/badge/webpack-free-orange.svg)

This is a static website generator that uses [React](https://facebook.github.io/react/) and produces isomorphic websites that do **client-side routing and rendering**, which is fast; but also work as completely **static HTML pages** at any route, which is convenient; and also do not require your client to download the entire website content in a single `bundle.js`, which is great.

This magnificent task is accomplished through the hackish usage of fish shell, [browserify](https://github.com/substack/node-browserify), [catch-links](https://www.npmjs.com/package/catch-links), [AMD](https://github.com/QubitProducts/micro-amd) loading and some nasty browserify tricks (like the -r flag and `NODE_PATH` environment variable).

## What it does

Imagine you have a site structure like

```
.
├── about.html
├── articles
│   ├── and-you-and-i.md
│   ├── siberian-khatru.md
│   ├── cover.jpg
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
│   ├── cover.jpg
│   ├── close-to-the-edge
│   │   └── index.html  
│   └── close-to-the-edge.js
├── articles.js  
├── bundle.js  
├── index.html
├── index.js
└── style.css
```

All the `.html` files are there for the first load at any route. After that, every time the visitor clicks on an internal link, the code at `/bundle.js` will catch that event, push to the visitor's browser history and load the corresponding `.js` file for the new route.

The `.js` files are small, they do not contain any external dependencies bundled with them, but only the code (or text) present on the source file for that page. All `node_modules` dependencies (as declared in `package.json`) will be bundled only once at `/bundle.js`, including the **wrapper**, the **helmet** and the **content** special modules.

## How to use

Install it with `npm install react-site` globally or locally in your site's directory. Then run it with `react-site` (or `./node_modules/.bin/react-site`). **react-site** treats your current directory to be the root of your site, and will save the built files under `./_site/`. It expects you to have 4 special files/modules:

  - **helmet** (any file named with "head" or "helmet" will work here, try `helmet.js`)
    - this file should `require('react-helmet')` and export a _React component_ that will and return a Helmet.
    - this Helmet component will be used to render your website's static `<head>` and update it as the client navigates.
  - **content** (any file with "body", "content" or "main" in the name will work, try `content.js`)
    - this file should export _a React component_ that will draw the basic, static, site structure. Maybe you want a footer, a static header, whatever. You do it here. This will be rendered inside `<body>` (`document.body`).
    - this file will receive some `this.props.children`, which you must embed somewhere, because that is where the specific content of each page will be.
    - this file also has the duty to include `/bundle.js`, the script that makes all the client-side things work. If you do not include this the website will be a pure static-HTML website of the 90's.
  - **wrapper** (any file that has "wrap" in its name, try `wrapperFactory.js` or `makeWrapper.js`):
    - this file should export _a function_ that takes an two arguments: `(meta, content)`, and returns a React component that should render the main view of the site.
    - it will be called for every page of the site, receiving different `meta` and `content` each time, according to the file.
      - `meta` is an object with `{filename, pathname}` and any other meta definitions found in the file. For HTML, text or markdown files metadata will be parsed from the [YAML front-matter](https://www.npmjs.com/package/gray-matter#example-usage) if it is present; for JS files it will be fetched from an exported `.meta` object (`module.exports.meta`) if it is present. Setting metadata like that may be useful for rendering titles, tags and all that.
        - `.filename` is the path of file that is being rendered. You can determine the file type here and do different things if it is `.txt`, `.md`, `.html`, `.js`, whatever.
        - `.pathname` is the address of the page for the referred file. Useful for generating links. For example, if the file is at `abc/dfg.md` then `.pathname` will be `/abc/dfg/`.
      - `content` is the content of the file. If it is a JS file it will be the JS module, as exported in `module.exports`, you know (it may be a React component, for example). If it is any other file it will be the raw file contents (text, mainly).
    - If it is an `.md` file, for example, you should parse frontmatter and markdown by yourself in this file.
  - `package.json`
    - this is needed because we look at the dependencies declared at `.dependencies` and bundle them all together on `bundle.js`. All dependencies that come with **react-site** are also bundled there, so you shouldn't have any `'react'`,  `'react-dom'` or whatever declared OR installed in your `node_modules`. If you have any of these they will take precedence over the react-site versions. Problems will occur if you have packages that depend on React and install it on your `node_modules`, as this will cause React to be bundled twice and cause errors, so make sure you delete React from your tree and let the packages use all the same React react-site provides.

The components defined at **wrapper**, **helmet** and **content** will all receive some useful `props`. These will be:

  - `.meta`: the metadata for the current page.
  - `.pages`: an object with all the metadata for all pages, keyed by `.pathname` (useful for generating indexes or sub-indexes).
  - `.location`: the `location` object from [history](https://www.npmjs.com/package/history).

### Command-line usage:

```
react-site - simple and hackable static website generator with React and browserify.
usage: react-site <command> [options]
commands:
    build - builds the site at the current directory, saves the output at ./_site/
      will minify bundle.js and set NODE_ENV to 'production'.
    serve - starts watching files to rebuild the site and serving them. 
      will use --debug flag will be used and set NODE_ENV to 'development'.
      doesn't do HMR, you still have to reload/reclick dependending on what you changed.
```

## External dependencies

If you do not have [fish shell](https://fishshell.com/) you can't use this (of course you can install it and replace your current shell with it -- or just install it to run the build script, that will work too, `sudo apt-get install fish` or whatever).

The build script also needs [jq](https://stedolan.github.io/jq/manual/), the CLI tool that does magic with JSON. If you don't have it, you should, it will make your life better every time you do any JSON work, so please install it globally. `sudo apt-get install jq` should work.

For the live-rebuilding we require you to have [entr](http://entrproject.org/) which you can probably install with `sudo apt-get install entr` or similar command.

### Examples

 - [inflação.org](https://inflacao.org/) - [GitHub](https://github.com/fiatjaf/inflacao.org)
