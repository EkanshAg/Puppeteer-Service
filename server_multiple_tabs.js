const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const axios = require('axios');
import getStaticUrl from './generateUrl'; //Referred from static7/121
const args = process.argv;
var port = args[2] || 8888;
let browser = null;
let pendingRequest = 0;
let reqCount = 0;
let oldBrowsersArr = [];
let freqCloseBrowser = 10; // 10 sec 
let maxTabsToOpen = 20; // Max tabs to open in a browser
//const PuppeteerHar = require('puppeteer-har');

process.setMaxListeners(Infinity); // <== Important line

let srpURLsRegex = [
    "jobs-in-overseas-international(-\d+)?$",//jobs-in-overseas-international-{pageno}
    "psu-government-jobs-in-[a-zA-Z0-9,-]*(-\d+)?$",///psu-government-jobs-in-{location}-{pageno}
    "premium-jobs-in-[a-zA-Z0-9,-]*(-\d+)?$",//premium-jobs-in-{location}-{pageno}
    "jobs-in-[a-zA-Z0-9,-]*(-\d+)?$",//jobs-in-{location}-{pageno}
    "psu-government-jobs-for-((?!\-(in|\d)\-?).)+(-\d+)?$",//psu-government-jobs-for-{keywords}-{pageno}
    "premium-(?!similar|jobs-for-iit-engineering-graduates|jobs-for-iim-mba-graduates).+-jobs(-\d+)?$",//premium-{keywords}-jobs-{pageno}
    ".+-recruitment-jobs-\d+(-\d+)?$",//{company_name}-recruitment-jobs-{company_id}-{pageno}
    "(?!similar|psu-government|premium|top-company|browse|top-skill|international)[a-zA-Z0-9-]*-jobs(-\d+)?$",//{keywords}-jobs-{pageno}
    "psu-government-jobs-for-(?!similar).+-in-[a-zA-Z0-9,-]*(-\d+)?$",//psu-government-jobs-for-{keywords}-in-{location}-{pageno}
    "premium-(?!similar).+-jobs-in-[a-zA-Z0-9,-]*(-\d+)?$",//premium-{keywords}-jobs-in-{location}-{pageno}
    "(?!similar|psu-government|premium)[a-zA-Z0-9-]*-jobs-in-[a-zA-Z0-9,-]*(-\d+)?$",//{keywords}-jobs-in-{location}-{pageno}
    ".+-jobs-careers-\d+(-\d+)?$",//{company_name}-jobs-careers-{company_id}-{pageno}
    "premium-jobs-for-iim-mba-graduates-in-[a-zA-Z,-]*(-\d+)?$",//premium-jobs-for-iim-mba-graduates-in-{categories}-{pageno}
    "premium-jobs-for-iit-engineering-graduates-in-[a-zA-Z,-]*(-\d+)?$",//premium-jobs-for-iit-engineering-graduates-in-{categories}-{pageno}
    "[a-zA-Z,-]*-jobs-recruitment(-\d+)?$"//{industry}-jobs-recruitment-{pageno}
];
srpURLsRegex = srpURLsRegex.join('|');
srpURLsRegex = "/" + srpURLsRegex + "/";
srpURLsRegex = new RegExp(srpURLsRegex);
//console.log(srpURLsRegex);

initPuppeteer();

async function initPuppeteer() {


    browser = await createBrowserInstance();
    console.log('New Browser is opened........................')

    app.get('*', async (req, res) => {
        let dummy = Date.now();//req.originalUrl.match(/dummy=(.*)/)[1];
        // let t1 = new Date();
        // let t2 = null;
        // let t3 = null;
        // let t4 = null;
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
            let isPageReloadReq = {
                val: true
            };
            page.on('request', request => {
                //JD

                //console.log(request.resourceType());
                let resType = request.resourceType();
                let reqUrl = request.url();

                //Aborting all the images/font/other/uba requests
                if (resType === 'image' || resType === 'font' || resType === 'other' ||
                    reqUrl.match('dummy.com/uba') || reqUrl.match('googletagmanager.com') ||
                    reqUrl.match('googletagservices') || reqUrl.match('nLoggerJB') ||
                    reqUrl.match('j/ub_v') ||
                    //reqUrl.match(/jobapi\/(.)*\/ads/) ||
                    //reqUrl.match('bellyffad') ||
                    reqUrl.match('js-agent.newrelic')) {
                    request.abort();
                }
                // No advantage of using it
                // else if (resType === 'stylesheet') {
                //     request.respond({
                //         status: 302,
                //         body: ''
                //     });
                // }
                else if (request.url().match(/job-listings-*/)) {
                    const jobId = request.url().match(/job-listings-[a-zA-Z0-9\-]*([0-9]{12}).*/);
                    //This case will never happen
                    if (jobId == null) {
                        sendHTML = false;
                        let requestedDomain = 'https://www.dummy.com';
                        console.log("redirect " + requestedDomain, dummy);
                        res.redirect(301, requestedDomain);
                    }
                    else {
                        //console.log(request.url());
                        request.continue();
                    }
                }

                else {
                    //console.log(request.url());
                    request.continue();
                }

            });


            page.on('response', async response => {
                //console.log('response url ' + response.url());
                /**
                 * JD API
                 * jobapi/v1/job ->Desktop
                 * job-details-services/v1/job -> pwa
                 */
                let respUrl = response.url();

                if (respUrl.match(/jobapi\/(.)*\/job|job-details-services\/(.)*\/job/)) {
                    const status = response.status();
                    isPageReloadReq['val'] = false;
                    //console.log("status" + status);
                    if ((status >= 300) && (status <= 399)) {
                        //await page && !page.isClosed() && page.close();
                        //console.log('closing the tab.....in 300-399 status ', dummy);
                        sendHTML = false;
                        let reqHeaders = response.request().headers();
                        let headers = {};
                        for (let header in reqHeaders) {
                            if (header == 'appid') {
                                headers[header] = reqHeaders[header];
                            }
                            if (header == 'systemid') {
                                headers[header] = reqHeaders[header];
                            }
                        }
                        await axios.get(respUrl, { headers })
                            .then(response => {
                                //Will never come here
                                console.log(response.data);
                                res.redirect(301, "https://www.dummy.com/jobs-in-india");
                            })
                            .catch(error => {
                                console.log('3xx error ', dummy)
                                //console.log(error.response["data"])
                                if (error.response && error.response["data"] && error.response["data"].metaSearch) {
                                    let metaSearch = error.response["data"].metaSearch;

                                    let redirectUrl = getStaticUrl(metaSearch.keywords, metaSearch.city);
                                    console.log("redirectUrl " + redirectUrl, dummy);
                                    let requestedDomain = 'https://www.dummy.com';
                                    //console.log(requestedUrl);
                                    res.redirect(301, requestedDomain + "/" + redirectUrl);
                                    console.log('response is send ', dummy);
                                    console.log();

                                }
                                else {
                                    //console.log(error);
                                    console.log("redirecting to jobs in india ", dummy);
                                    res.redirect(301, "https://www.dummy.com/jobs-in-india");
                                }
                            });

                    }
                    else if ((status >= 400) && (status <= 599)) {
                        //await page && !page.isClosed() && page.close();
                        //console.log('closing the tab.....in 400-500 status ', dummy)
                        console.log(status + ' error ', dummy);
                        sendHTML = false;
                        console.log('Sending the response in JD 400-500 status ', dummy)
                        res.sendStatus(status);
                        console.log();
                    }
                }
                /**
                 * SRP API
                 * jobapi/v1/search
                 */
                else if (respUrl.match(/jobapi\/(.)*\/search/)) {
                    const status = response.status();
                    isPageReloadReq['val'] = false;
                    if ((status >= 300) && (status <= 599)) {
                        //await page && !page.isClosed() && page.close();
                        //console.log('closing the tab.....in 300-500 status ', dummy)
                        console.log(status + ' error', dummy);
                        sendHTML = false;
                        console.log('Sending the response in SRP 300-599 status ', dummy)
                        res.sendStatus(status);
                        console.log();
                    }
                }
                //SRP 301 handing
                else if (respUrl.match(srpURLsRegex)) {
                    //console.log('srp ');
                    //console.log(response.headers());
                    let resHeaders = response.headers();
                    if (resHeaders.status == 301) {
                        //await page && !page.isClosed() && page.close();
                        console.log('sending response in 301 SRP status ', dummy);
                        sendHTML = false;
                        let requestedDomain = 'https://www.dummy.com';
                        res.redirect(301, requestedDomain + resHeaders.location);
                        console.log('response is send ', dummy);
                        console.log();
                    }
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
                                    document.querySelectorAll('script:not([type="application/ld+json"])').forEach((obj) => obj.remove());
                                    //document.querySelectorAll('script[type="text/javascript"]').forEach((obj) => obj.remove());
                                    document.querySelectorAll('link[as="script"]').forEach((obj) => obj.remove());
                                } catch (scriptErr) {
                                    console.log(scriptErr, dummy);
                                }
                                return document.documentElement.innerHTML;
                            });
                            const body = await page.content();
                            res.send(body);
                            console.log('response is send with status 200', dummy);
                            console.log();
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
    let newbrowser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--ignore-certificate-errors', '--enable-features=NetworkService'] });
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

