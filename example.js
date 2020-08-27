const puppeteer = require('puppeteer');
const fs = require('fs')
const https = require('https')
const dayjs = require('dayjs')

const PAGE_URL = 'https://www.v2ph.com/album/Ugirls-U423?page=2&hl=zh-Hans';


const target = dayjs().format('YY-MM-DD' + `${Date.now()}`)

fs.mkdirSync(`./images/${target}`)

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {

          clearInterval(timer);
          resolve();
        }
      }, 120);
    });
  });
}


const downImages = async (urls) => {
  const res = await Promise.all(
    urls.map((url, index) => {
      return new Promise((resolve, rej) => {
        https.get(url, res => {
          let imageData = ''
          res.setEncoding('binary')
          res.on('data', chunk => {
            imageData += chunk
          })

          res.on('end', () => {
            fs.writeFile(
              `./images/${target}/${index}.jpg`,
              imageData,
              "binary",
              err => {
                if (err) {
                  console.log('err', err);
                } else {
                  resolve({ code: 1, msg: "success" })
                }
              }
            )
          })
        })
      })
    })
  )
  console.log('res', res);
}


(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.goto(PAGE_URL);
  // await page.screenshot({ path: 'example.png' });

  await page.waitForSelector('img.album-photo');

  let finishTime = new Date().getTime() + (60 * 1000);
  await autoScroll(page, finishTime);

  let urls = await page.$$eval('img.img-fluid',
    function (els) {
      console.log('els', els);
      return [...els].map(el => el.getAttribute('src'))
    })

  console.log('urls', urls);

  const images = await downImages(urls)
  // writeImage('')
})();

// 