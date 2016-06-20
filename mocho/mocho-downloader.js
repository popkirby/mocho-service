const jsdom = require('jsdom')
const co = require('co')
const sleep = require('sleep')
const fs = require('fs')

const MOCHO_BASE = 'http://ameblo.jp/asakuramomoblog'
const JQUERY_URL = 'http://code.jquery.com/jquery.js'

// 記事一覧から記事URLを取得する
function getArticleUrl(page) {
  return new Promise((resolve, reject) => {
    jsdom.env(
      `${MOCHO_BASE}/entrylist${(page > 0) ? `-${page}` : ''}.html`,
      [JQUERY_URL],
      (err, window) => {
        if(err) return reject(err)

        console.log(`Getting artiles from pagelist ${page}`)
        const $ = window.$
        let articleUrls = []

        for (let nodes of $('.contentTitle').toArray()) {
          articleUrls.push(nodes.href)
        }

        return resolve(articleUrls)
      }
    )
  })
}

// 記事URLから記事内容を取得
function getArticleContent(url) {
  return new Promise((resolve, reject) => {
    jsdom.env(
      url,
      [JQUERY_URL],
      (err, window) => {
        if (err) return reject(err)

        console.log(`Getting article content from ${url}`)
        const $ = window.$

        return resolve($('.articleText')[0].textContent.trim())
      }
    )
  })
}

co(function *() {
  let articleUrls = []

  for (let i = 1; i <= 19; i++) {
    articleUrls = articleUrls.concat(yield getArticleUrl(i))
    sleep.usleep(500000)
  }

  for (let articleUrl of articleUrls) {
    let content = yield getArticleContent(articleUrl) + '\n'
    fs.writeFile(`articles/${articleUrl.match(/entry-(\d+)\.html/)[1]}.txt`, content)
    sleep.usleep(500000)
  }
})
