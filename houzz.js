const puppeteer = require('puppeteer')
const fs = require('fs')
const { parse } = require('csv-parse')
const csv = require('csv-stringify')

async function main () {
  try {
    const browser = await puppeteer.launch({ headless: false, args: ['--disable-dev-shm-usage','--disable-dev-shm-usage',] })
    const pages = await browser.pages()
    const page = pages[0]
    await page.setViewport({ width: 1400, height: 720 })
    await page.goto('https://www.houzz.com/professionals/general-contractor/probr0-bo~t_11786', { waitUntil: 'load' })
    await delay(6000)

    await page.click('input.pro-location-autosuggest__input')
    await delay(1000)
    // await page.keyboard.type('Bridgeport')
    // await page.keyboard.press('Enter')
    let divsLength = await page.$$eval('div.pro-location-autosuggest__suggestions-container div.pro-location-autosuggest__section-container', (items) => {
      return items.length
    })
    await delay(1000)
    await page.evaluate((elemLength) => {
      let strElem = 'div.pro-location-autosuggest__suggestions-container div.pro-location-autosuggest__section-container:nth-child(' + elemLength + ') ul'
      let parentNodes = document.querySelector(strElem)
      let nodeList = parentNodes.querySelectorAll('li')
      for (let i = 0; i < nodeList.length; i++) {
        if (nodeList[i].querySelector('li a').innerText === 'Albuquerque') {
          nodeList[i].querySelector('li a').click()
        }
      }
    }, divsLength)

    await delay(5000)
    let listofUrls = []
    let currentPage = 0
    let pagination = 0
    let count = 0

    do {
      const isConnected = await checkInternetConnection(page);
      console.log('isConnected===', isConnected)
      if (!isConnected) {
        console.log('Internet connection lost, waiting to reconnect... 2');
        await delay(5000); // Wait 5 seconds before checking again
        continue;
      } 
      // else {
        console.log('Internet connection restored, reloading page...');
        // await page.reload({ waitUntil: 'load' });
      // }
      await delay(5000)
      console.log("++++++++++++++++++++")
      let itemsPerPage = await page.$$eval('ul.hz-pro-search-results li.hz-pro-search-results__item', (items) => {
        return items.length
      })

      await delay(3000)
      await page.evaluate(() => {
        let countItems  = document.querySelectorAll('ul.hz-pro-search-results li').length
        for (let i = 1; i <= countItems; i++) {
          if (document.querySelector(`ul.hz-pro-search-results li.hz-pro-search-results__item:nth-child(${i})`) != null) {
            document.querySelector(`ul.hz-pro-search-results li:nth-child(${i}) a`).click()
          }
        }
      })
      await delay(8000)
      let pages2 = await browser.pages()
      await delay(5000)
      for (let i = 1; i <= itemsPerPage; i++) {
        console.log('page2=========================', pages2[i])
        console.log('page2 typeof =========================', typeof pages2[i])
        if(pages2[i] !== undefined) {
          let page2 = pages2[i]
          try {
            await delay(7000)
            if (await page2.waitForSelector('section#business div div:nth-child(3) p a div span') != null) {
              await page2.waitForSelector('section#business div div:nth-child(3) p a div span', { timeout: 0 }).catch(() => console.log('Class section#busines doesn\'t exist!'))
                let element = await page2.waitForSelector('section#business div div:nth-child(3) p a div span')
                let url = await element.evaluate(el => el.textContent)
                await delay(1000)
                listofUrls.push([url])
                console.log('url===========', url)
            }
          } catch (error) {
            console.log('errrorr', error)
          } finally {
            await delay(1000)
            await page2.close()
            console.log('page2 closed===========')
            await delay(1000)
          }
        } else {
          // let page2 = pages2[1]
          // console.log('most likely closed page')
          // await delay(4000)
          // await page2.close()
          count++;
        }
      }
      console.log('listofUrls========', listofUrls)
      currentPage++
      await delay(4000)
      const nextPagination = await page.evaluate(() => {
        let nextPage = false 
        if (document.querySelector('.hz-pagination-bottom .hz-pagination-link--selected').nextSibling != null) {
          document.querySelector('.hz-pagination-bottom .hz-pagination-link--selected').nextSibling.click()
        } else {
          nextPage = true
        }
        return nextPage
       })

       console.log('nextPagination====', nextPagination)
       // clicking to refresh the page because pagination does not displayed
       if (nextPagination) {
          await delay(5000)
          console.log("Page Refreshed")
          // Execute JavaScript code to refresh the page
          await page.evaluate(() => {
            location.reload(true);
          });
          
          // Wait for the page to finish reloading
          await page.waitForNavigation();
          await delay(5000)
          if (document.querySelector('.hz-pagination-bottom .hz-pagination-link--selected').nextSibling != null) {
            document.querySelector('.hz-pagination-bottom .hz-pagination-link--selected').nextSibling.click()
          }
       }
       
      pagination = await page.evaluate(() => {
        let paginationElem
        if (document.querySelector('.hz-pagination-bottom .hz-pagination-link--selected').nextSibling) {
          paginationElem = document.querySelector('.hz-pagination-bottom .hz-pagination-link--selected').nextSibling.innerText
        }
        return paginationElem
      })
      // remove and create file
      try { 
        await delay(2000)
        if (fs.existsSync('listofurls.csv')) { // Check if the file exists
            await fs.unlinkSync('listofurls.csv'); // If it exists, delete it
        }
        await delay(6000)
        csv.stringify(listofUrls, (e, o) => fs.writeFileSync('listofurls.csv', o))
      } catch(error) {
        console.log('erroorr', error)
      }


      // most likely page closed
      for(let y = 0; y < count; y++) {
        const pages3 = await browser.pages()
        let page3 = pages3[1]
        console.log('most likely closed page')
        await delay(4000)
        await page3.close()
      }
      count = 0;
    } while (pagination > currentPage)

    console.log('listofUrls result-----', listofUrls)
    csv.stringify(listofUrls, (e, o) => fs.writeFileSync('listofurls.csv', o))
    console.log('++++++++++++ Successfully created urls list file ++++++++++++')
    await delay(20000)
    browser.close()
  } catch (error) {
    console.log('error', error)
  }
}

main()

function delay (time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  })
}

async function checkInternetConnection(page) {
  try {
    const element = await page.$('#houzzHeader');
    console.log('element====', element)
    if (element) {
      return true;
    } else {
      console.log("restart intenrnet")
      // Execute JavaScript code to refresh the page
      await page.evaluate(() => {
        location.reload(true);
      });
      
      // Wait for the page to finish reloading
      await page.waitForNavigation();
      await delay(2000)
      return false;
    }
  } catch (error) {
    return false;
  }
}