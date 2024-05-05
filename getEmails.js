const puppeteer = require('puppeteer')
const fs = require('fs')
const { parse } = require('csv-parse')
const csv = require('csv-stringify')

async function main () {
  webUrls = []
  fs.createReadStream('./listofurls.csv')
    .pipe(parse({ delimiter: ',', from_line: 2 }))
    .on('data', async function (row) {
      if(row[0] != 'null') {
        // webUrls.push(row)
      }
    })

  await delay(5000)
  webUrls = [
    [ 'https://www.foleycontracting.com/' ],
    [ 'https://ehreckeconstruction.com/' ],
    [ 'https://www.aaacontractingqca.com/' ],
    [ 'https://www.thomasconstructioniowa.com/' ],
    [ 'https://www.ameriproroofing.com/' ],
    [ 'https://lynchheatingandplumbing.com/' ],
    [ 'http://www.teetimelawncare.com/' ]
  ]

  let listOfEmails = []
  for (const url of webUrls) {
    await delay(1000)
    const browser = await puppeteer.launch({
      args: [
          '--disable-setuid-sandbox',
          '--no-sandbox',
          '--ignore-certificate-errors',
      ],
    //   ignoreHTTPSErrors: true,
      headless: false,
  })
    try {
      const page = await browser.newPage()
      await page.setViewport({ width: 1000, height: 720 })
      await page.goto(url[0], { waitUntil: 'load', timeout: 0 })
      console.log('website url============>', url[0])
      await delay(6000)
      const emails = await page.evaluate(() => {
        const contentToSearch = document.body.innerHTML
        let contentAsText = contentToSearch.toString()
        let emailList = contentAsText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi)
        return emailList
      })
      await delay(1000)
      listOfEmails.push(emails)
      console.log('listOfEmails=====>', listOfEmails)
      // browser.close()
    } catch (error) {
      console.log('error============>', error)
    }
    browser.close()
  }

  try {
    listOfEmails = listOfEmails.filter(val => val != null)
    console.log('listOfEmails-result----', listOfEmails)
    finalEmails = []
    for (const emails of listOfEmails) {
      console.log('emails result-----', emails)
      cleanedEmails = []
      for (let x = 0; x < emails.length; x++) {
        console.log('emails==========', emails[x])
        if (emails[x].includes('.png') || emails[x].includes('.jpg') || emails[x].includes('@lg.x') || emails[x].includes('@1.8.1')
          || emails[x].includes('@md.x') || emails[x].includes('@sm.x') || emails[x].includes('.gif') || emails[x].includes('@2.2.10')
          || emails[x].includes('@2.4.0') || emails[x].includes('@1.0.2') || emails[x].includes('.webp') || emails[x].includes('.frontend')
          || emails[x].includes('@33.8130702') || emails[x].includes('@2.0.0-rc.2') || emails[x].includes('@2.0.2') || emails[x].includes('2.3.1')
          || emails[x].includes('@5.2.1') || emails[x].includes('@16.14.0') || emails[x].includes('@1.17.0')) {
          console.log('This email does not exist')
        } else {
          cleanedEmails.push(emails[x])
        }
      }
      finalEmails.push(cleanedEmails)
    }
    console.log('finalEmails result-----', finalEmails)
    await delay(2000)
    if (fs.existsSync('emails.csv')) { // Check if the file exists
        await fs.unlinkSync('emails.csv'); // If it exists, delete it
    }
    csv.stringify(finalEmails, (e, o) => fs.writeFileSync('emails.csv', o))
    console.log('++++++++++++ Successfully created your email file ++++++++++++')
    await delay(3000)
  } catch (error) {
    console.log('error email============>',error)
  }
}

main()

function delay (time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  })
}