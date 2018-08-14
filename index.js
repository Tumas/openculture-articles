const puppeteer = require('puppeteer')
const fs = require('fs')

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

async function getArticles(page) {
  const articlesLength = await page.evaluate((name) => document.getElementsByClassName(name).length, 'recent_post')
  const ARTICLE_SELECTOR = '.contentmiddle div:nth-child(INDEX) > h1 > a'
  const DATE_SELECTOR = '.contentmiddle div:nth-child(INDEX) p.byline em'
  const articles = []

  for (let i = 1; i <= articlesLength; i++) {
    const articleSelector = ARTICLE_SELECTOR.replace("INDEX", i)
    const dateSelector = DATE_SELECTOR.replace("INDEX", i)

    const article = await page.evaluate((selector) => {
      return {
        title: document.querySelector(selector).innerHTML.trim(),
        link: document.querySelector(selector).getAttribute('href')
      }
    }, articleSelector)

    const date = await page.evaluate((selector) => {
      return document.querySelector(selector).nextSibling.textContent.replace("|", '').trim()
    }, dateSelector)

    articles.push({ ...article, date })
  }

  return articles
}

async function run() {
  const URL = 'http://openculture.com/page/INDEX'
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  const PAGES = 1000

  let articles = []

  for (let pageNumber = 1; pageNumber < PAGES; pageNumber++) {
    console.log(URL.replace("INDEX", pageNumber))

    await page.goto(URL.replace("INDEX", pageNumber))
    const arts = await getArticles(page)

    articles = articles.concat(arts)
    await delay(2000)

    fs.writeFile('articles.json', JSON.stringify(articles), 'utf8', () => console.log('complete'))
  }

  browser.close()
}

run()
