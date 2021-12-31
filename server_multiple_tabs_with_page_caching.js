const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const axios = require('axios');
//import getStaticUrl from './generateUrl'; //Referred from static7/121
const args = process.argv;
var port = args[2] || 8888;
let browser = null;
let pendingRequest = 0;
let reqCount = 0;
let oldBrowsersArr = [];
let freqCloseBrowser = 10; // 10 sec 
let timeToUpdateCache = 1000 * 60 * 60 * 1; // 1 hr
let maxTabsToOpen = 20; // Max tabs to open in a browser
//const PuppeteerHar = require('puppeteer-har');

process.setMaxListeners(Infinity); // <== Important line

initPuppeteer();

let cachedMap = new Map();

async function initPuppeteer() {

    browser = await createBrowserInstance();
    console.log('New Browser is opened........................')

    app.get('*', async (req, res) => {
        let dummy = Date.now();//req.originalUrl.match(/dummy=(.*)/)[1];
        let page = null;
        //let har = null;
        try {
            if (req.originalUrl.match('favicon')) {
                res.sendStatus(404);
                return;
            }
            reqCount++;
            pendingRequest++;
            browser = await closeBrowser(browser);


            console.log('New Request is received......', dummy);
            console.log(req.originalUrl + " " + dummy);

            let pathName = req.originalUrl;
            let queryParamIndex = pathName.indexOf('?');
            if (queryParamIndex > -1) {
                pathName = pathName.substring(0, queryParamIndex);
            }
            // console.log("cachedMap ", cachedMap.has(pathName), pathName == "/", cachedMap.size);
            if (cachedMap.has(pathName)) {
                let cachedObj = cachedMap.get(pathName);
                res.send(cachedObj.html);
                if (new Date().getTime() - cachedObj.lastCachedTime <= timeToUpdateCache) {
                    //console.log("refresh time has not yet come for ", pathName);
                    return;
                }
            }
            //console.log("it will not print");

            //tabs = await browser.pages();

            //console.log('No of opened tabs -', tabs.length);
            try {
                page = await browser.newPage();
            }
            catch (e) {
                browser = await closeBrowser(browser, true);
                page = await browser.newPage();
            }

            //await page.waitFor(15000);

            //har = new PuppeteerHar(page);
            //await har.start({ path: 'results.har' });
            //t2 = new Date();
            //console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@browser opening time ", t2 - t1);
            const headers = req.headers;
            // console.log(headers);

            //const isMobile = headers['HTTP_X_MOBILE'];
            const isMobile = headers['user-agent'];
            // console.log(userAgent);
            //For Mobile google-bot
            if (isMobile && isMobile.match(/mobile/gi)) {
                page.setUserAgent('Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.76 Mobile Safari/537.36');
            }

            let isCrawler = '';
            if (req.originalUrl.indexOf('?') > -1) {
                isCrawler = '&isCrawler=1';
            }
            else {
                isCrawler = '?isCrawler=1';
            }
            let requestedUrl = 'https://www.dummy.com' + req.originalUrl + isCrawler;
            //console.log("Requested Url:- ", requestedUrl);

            // Intercept API response and pass mock data for Puppeteer
            await page.setRequestInterception(true);
            let sendHTML = true;

            page.on('request', request => {
                //JD

                //console.log(request.resourceType());
                let resType = request.resourceType();
                let reqUrl = request.url();

                //Aborting all the images/font/other/uba requests
                if (
                    //resType === 'image' || resType === 'font' || resType === 'other' ||
                    // reqUrl.match('dummy.com/uba') || reqUrl.match('googletagmanager.com') ||
                    // reqUrl.match('googletagservices') || reqUrl.match('nLoggerJB') ||
                    // reqUrl.match('j/ub_v') ||
                    reqUrl.match('js-agent.newrelic')) {
                    request.abort();
                }
                else {
                    //console.log(request.url());
                    request.continue();
                }

            });


            // page.on('console', msg => {
            //     console.log('message ' + msg.text());
            // });

            // page.on('error', msg => {
            //     console.log('Error on page----------------------------------');
            //     console.log(msg);
            // });

            try {
                await page.goto(requestedUrl, { waitUntil: 'networkidle0', timeout: 20000 }); //max time to w8 is 20 sec
                //await page.screenshot({ path: '/data/apps/jobsearch/jd-screenshot.png' });
            }
            catch (e) {
                //Navigation failed because browser has disconnected!
                //Navigation fail error- Not an issue- 301 cases

                //Time-out error of 30 sec
                //console.log(e);
            }
            finally {
                try {
                    if (sendHTML) {
                        if (page && (!page.isClosed())) {
                            await page.evaluate(() => {
                                try {
                                    //remove all the sript tags except the schema ones
                                    //document.querySelectorAll('script:not([type="application/ld+json"])').forEach((obj) => obj.remove());
                                    //document.querySelectorAll('script[type="text/javascript"]').forEach((obj) => obj.remove());
                                    //document.querySelectorAll('link[as="script"]').forEach((obj) => obj.remove());
                                } catch (scriptErr) {
                                    console.log(scriptErr, dummy);
                                }
                                return document.documentElement.innerHTML;
                            });
                            const body = await page.content();
                            //console.log("res.headersSent ", res.headersSent);
                            !res.headersSent && res.send(body);
                            console.log('response is send with status 200', dummy);
                            console.log();
                            cachedMap.set(pathName, {
                                html: body,
                                lastCachedTime: new Date().getTime()
                            });
                            //t3 = new Date();
                            //console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@responded back ', t3 - t1);

                            //finally , we remove listeners in case the response event fire more than once
                            page.removeAllListeners('response');
                        }
                    }
                }
                catch (e) {
                    console.log(e, dummy);
                }

            }

        } catch (err) {
            console.log(err, dummy);
            //await browser.close();
            //await page.close();
        }
        finally {
            pendingRequest--;
            console.log("No of pending request " + pendingRequest, dummy);
            //await browser.close();
            //console.log('closing the tab.....in finally')
            try {
                //await page.waitFor(30000);
                //await har.stop();
                await page && !page.isClosed() && page.close();
                //t4 = new Date();
                // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@browser opening time ", t2 - t1, dummy);
                // console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@responded back ', t3 - t2, dummy);
                // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@browser close time ", t4 - t3, dummy);
                // console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@Total time ', t4 - t1, dummy);
                console.log('-------------------------------------------', dummy);
            }
            catch (error) {
                //console.log(error);
            }

        }

    });


}

async function closeBrowser(alreadyOpenedbrowser, isOpenNewBrowser = false) {
    if (isOpenNewBrowser || (reqCount % maxTabsToOpen == 0)) {
        //console.log('Tab Count is ' + reqCount, '-------------------------------------------------Sending browser for GC');
        reqCount = 0;
        oldBrowsersArr.push(alreadyOpenedbrowser);
        return await createBrowserInstance();
    }
    else {
        return alreadyOpenedbrowser;
    }
}



async function closeOldBrowser(alreadyOpenedbrowser) {
    let openedtabs = await alreadyOpenedbrowser.pages();
    //console.log("----------------------------------------------------------Attempting to close Browser");
    //1 bcz there is always one unsed tab in the browser and it got created at the time of browser init
    //console.log(openedtabs.length);
    if (openedtabs.length == 1) {
        await alreadyOpenedbrowser && alreadyOpenedbrowser.close();
        // console.log('Old Browser is closed.....................................');
        // console.log("##########################################################");
        // console.log();
        // console.log();
        // console.log();
        // console.log();
        return true;
    }

    else {
        return false;
    }
}

async function createBrowserInstance() {
    //console.log("Creating new Browser Instance----------------");
    // let newbrowser = await puppeteer.launch({
    //     args: ['--enable-features=NetworkService'],
    //     headless: false,
    //     ignoreHTTPSErrors: true
    //     //devtools: true
    // });
    let newbrowser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors', '--enable-features=NetworkService'] });
    //browserIntanceCreationTime = Date.now();
    console.log("Created New Browser Instance----------------");
    return newbrowser;
}


async function closeOpenedOldBrowser() {
    //console.log('------------------------------------------------------------------No of Browsers available for GC: ' + oldBrowsersArr.length);
    for (let index = 0; index < oldBrowsersArr.length; index++) {
        let isBrowserClosed = await closeOldBrowser(oldBrowsersArr[index]);
        if (isBrowserClosed) {
            oldBrowsersArr.splice(index, 1);
            index--;
        }

    }

}

setInterval(() => {
    //console.log("----------------------------------------------------------------Attempting to close opened Browsers after " + freqCloseBrowser + " sec");
    closeOpenedOldBrowser();
}, 1000 * freqCloseBrowser);


app.listen(port, () => console.log(`Server is up`))

