const { Service, checkGitStatus, executeScriptAsync } = require('clean-scripts')
const { watch } = require('watch-then-execute')

const tsFiles = `"*.ts" "spec/**/*.ts" "screenshots/**/*.ts" "prerender/**/*.ts"`
const jsFiles = `"*.config.js" "spec/**/*.config.js"`

const templateCommand = `file2variable-cli app.template.html -o variables.ts --html-minify --vue --vue-type-name "App" --vue-type-path "./index"`
const tscCommand = `tsc`
const webpackCommand = `webpack`
const revStaticCommand = `rev-static`
const cssCommand = [
  `postcss index.css -o index.postcss.css`,
  `cleancss index.postcss.css -o index.bundle.css`
]
const swCommand = [
  `sw-precache --config sw-precache.config.js`,
  `uglifyjs service-worker.js -o service-worker.bundle.js`
]

module.exports = {
  build: [
    {
      js: [
        templateCommand,
        tscCommand,
        webpackCommand
      ],
      css: {
        vendor: `cleancss ./node_modules/bootstrap/dist/css/bootstrap.min.css ./node_modules/github-fork-ribbon-css/gh-fork-ribbon.css -o vendor.bundle.css`,
        index: cssCommand
      },
      clean: `rimraf vendor.bundle-*.js vendor.bundle-*.css index.bundle-*.js index.bundle-*.css`
    },
    revStaticCommand,
    swCommand
  ],
  lint: {
    ts: `tslint ${tsFiles}`,
    js: `standard ${jsFiles}`,
    export: `no-unused-export ${tsFiles}`,
    commit: `commitlint --from=HEAD~1`
  },
  test: [
    'tsc -p spec',
    'karma start spec/karma.config.js',
    () => checkGitStatus()
  ],
  fix: {
    ts: `tslint --fix ${tsFiles}`,
    js: `standard --fix ${jsFiles}`
  },
  watch: {
    template: `${templateCommand} --watch`,
    src: `${tscCommand} --watch`,
    webpack: `${webpackCommand} --watch`,
    css: () => watch(['index.css'], [], () => executeScriptAsync(cssCommand)),
    rev: `${revStaticCommand} --watch`,
    sw: () => watch(['vendor.bundle-*.js', 'index.html', 'worker.bundle.js'], [], () => executeScriptAsync(cssCommand))
  },
  screenshot: [
    new Service(`http-server -p 8000`),
    `tsc -p screenshots`,
    `node screenshots/index.js`
  ],
  prerender: [
    new Service(`http-server -p 8000`),
    `tsc -p prerender`,
    `node prerender/index.js`,
    revStaticCommand,
    swCommand
  ]
}
