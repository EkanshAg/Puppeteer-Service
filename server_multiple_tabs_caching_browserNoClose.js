const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const axios = require('axios');
import getStaticUrl from './generateUrl'; //Referred from static7/121
import { fetchDropdownLabel } from './dropdown'; //Referred from static7/121
const args = process.argv;
var port = args[2] || 8888;
//let browser = null;
let pendingRequest = 0;
let reqCount = 0;
let oldBrowsersArr = [];
let freqCloseBrowser = 30; // 30 sec 
let maxTabsToOpen = 20; // Max tabs to open in a browser
let dirPath = 'file:///' + __dirname + '/static';
const RENDER_CACHE = new Map();
var fs = require('fs');
const PuppeteerHar = require('puppeteer-har');

process.setMaxListeners(Infinity); // <== Important line

initPuppeteer();

async function initPuppeteer() {
    console.log('inside initPuppeteer');
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
    console.log(srpURLsRegex);
    
    let browserWSEndpoint = null;
    if (!browserWSEndpoint) {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors', '--enable-features=NetworkService'] });
        browserWSEndpoint = await browser.wsEndpoint();
    }

    app.get('*', async (req, res, next) => {
        console.log('New Request is received......');
        if (!browserWSEndpoint) {
            const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors', '--enable-features=NetworkService'] });
            browserWSEndpoint = await browser.wsEndpoint();
        }

        //const url = `${req.protocol}://${req.get('host')}/index.html`;
        await ssr(req, res, browserWSEndpoint);
    });



    async function ssr(req, res, browserWSEndpoint) {
        let dummy = '';// req.originalUrl.match(/dummy=(.*)/)[1];
        let t1 = new Date();
        let t2 = null;
        let t3 = null;
        let t4 = null;
        let page = null;
        let har = null;
        try {
            if (req.originalUrl.match('favicon')) {
                res.sendStatus(404);
                return;
            }
            reqCount++;
            pendingRequest++;
            console.info('Connecting to existing Chrome instance.');
            const browser = await puppeteer.connect({ browserWSEndpoint });

            console.log(req.originalUrl);

            page = await browser.newPage();
            //har = new PuppeteerHar(page);
            //await har.start({ path: 'results.har' });
            t2 = new Date();
            // const headers = req.headers;
            // const platform = headers['platform'];
            // if (platform == 'mobile') {
            //     page.setUserAgent('Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.76 Mobile Safari/537.36');
            // }

            let requestedUrl = 'https://www.dummy.com' + req.originalUrl;
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
                //console.log(reqUrl.match(new RegExp(srpURLsRegex)));
                //Aborting all the images/font/other/uba requests
                if (resType === 'image' || resType === 'font' || resType === 'other' ||
                    reqUrl.match('dummy.com/uba') || reqUrl.match('googletagmanager.com/gtm.js') ||
                    reqUrl.match('nLoggerJB') || reqUrl.match('j/ub_v') || reqUrl.match(/jobapi\/(.)*\/ads/) || reqUrl.match('bellyffad')) {
                    request.abort();
                }
                else if (resType === 'stylesheet' || resType === 'script') {
                    //only static 7 folder files
                    let staticUrl = reqUrl.match(/static.naukimg.com\/s\/7\/(.*)/);
                    let fileUrl = (staticUrl && staticUrl[1]) || null;
                    // console.log('inside req ', fileUrl);
                    if (fileUrl) {
                        if (RENDER_CACHE.has(fileUrl)) {
                            //console.log('served from local cache');
                            //console.log(RENDER_CACHE.get(fileUrl));
                            request.respond({
                                status: 302,
                                body: RENDER_CACHE.get(fileUrl)
                            });
                        }
                        else {
                            fs.readFile('static/' + fileUrl, function read(err, data) {
                                if (err) {
                                    console.error(err);
                                    request.continue();
                                    return;
                                }
                                //console.log(fileUrl);
                                //console.log(data.toString());
                                RENDER_CACHE.set(fileUrl, data.toString());
                                // console.log(RENDER_CACHE.get(fileUrl));
                                request.respond({
                                    status: 302,
                                    body: data,
                                });


                            });
                        }

                    }
                    else {
                        request.continue();
                    }
                }
                else if (reqUrl.match(/job-listings-*/)) {
                    const jobId = request.url().match(/job-listings-[a-zA-Z0-9\-]*([0-9]{12}).*/);
                    //This case will never happen
                    if (jobId == null) {
                        sendHTML = false;
                        let requestedDomain = 'https://www.dummy.com';
                        console.log("redirect " + requestedDomain);
                        res.redirect(301, requestedDomain);
                    }
                    else {
                        //console.log(request.url());
                        request.continue();
                    }
                }
                else if (reqUrl.match(srpURLsRegex)) {
                    console.log('srp index')
                    if (RENDER_CACHE.has('srp_index')) {
                        //console.log('served from local cache');
                        //console.log(RENDER_CACHE.get(fileUrl));
                        request.respond({
                            status: 302,
                            body: RENDER_CACHE.get('srp_index')
                        });
                    }
                    else {
                        fs.readFile('static/109/index.html', function read(err, data) {
                            if (err) {
                                console.error(err);
                                request.continue();
                                return;
                            }
                            //console.log(fileUrl);
                            //  console.log(data.toString());
                            RENDER_CACHE.set('srp_index', data.toString());
                            // console.log(RENDER_CACHE.get(fileUrl));
                            request.respond({
                                status: 302,
                                body: data,
                            });


                        });
                    }
                }
                else {
                    //console.log(request.url());
                    request.continue();
                }

            });

            // page.on("requestfailed", request => {
            //     const url = request.url();
            //     console.log("request failed url:", url);
            // });

            page.on('response', async response => {
                //console.log('response url ' + response.url());
                // jobapi/*/job -> JD API
                //console.log('inside response ', response.url(), ' ', response.status(), ' ', new Date());
                // let cssUrl = response.url().match(/static.naukimg.com\/s\/7\/(.*)/);
                // let fileUrl = (cssUrl && cssUrl[1]) || null;
                // console.log(fileUrl);
                // if (fileUrl) {
                //     let body = await response.buffer();
                //     // var dir = './109';

                //     // if (!fs.existsSync(dir)) {
                //     //     fs.mkdirSync('./109/j', { recursive: true });
                //     //     fs.mkdirSync('./109/c', { recursive: true });
                //     // }
                //     fs.writeFile(fileUrl, 'hi', (err) => {
                //         // In case of a error throw err. 
                //         if (err) {
                //             console.error(err);
                //         };
                //     })
                // }
                //else 
                if (response.url().match(/jobapi\/(.)*\/job/)) {
                    const status = response.status();
                    isPageReloadReq['val'] = false;

                    //console.log("status" + status);
                    if ((status >= 300) && (status <= 399)) {
                        await page && !page.isClosed() && page.close();
                        console.log('closing the tab.....in 300-399 status');
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

                        axios.get(response.url(), { headers })
                            .then(response => {
                                //Will never come here
                                console.log(response.data);
                                res.redirect(301, "https://www.dummy.com/jobs-in-india");
                            })
                            .catch(error => {
                                console.log('3xx error')
                                //console.log(error.response["data"])
                                if (error.response && error.response["data"] && error.response["data"].metaSearch) {
                                    let kw = '';
                                    let metaSearch = error.response["data"].metaSearch;
                                    if (metaSearch.hasOwnProperty('keywords')
                                        && metaSearch.keywords.length == 0
                                        && metaSearch.roleId) {
                                        let obj = {
                                            key: 'FA_ROLE',
                                            value: metaSearch.roleId
                                        };
                                        kw = fetchDropdownLabel(obj);
                                    }
                                    else {
                                        kw = metaSearch.keywords;
                                    }

                                    let redirectUrl = getStaticUrl(kw, metaSearch.city);
                                    console.log("redirectUrl " + redirectUrl);
                                    let requestedDomain = 'https://www.dummy.com';
                                    //console.log(requestedUrl);
                                    res.redirect(301, requestedDomain + "" + redirectUrl);
                                    console.log('response is send');
                                    console.log();

                                }
                                else {
                                    //console.log(error);
                                    console.log("redirecting to jobs in india");
                                    res.redirect(301, "https://www.dummy.com/jobs-in-india");
                                }
                            });
                    }
                    else if ((status >= 400) && (status <= 599)) {
                        await page && !page.isClosed() && page.close();
                        console.log('closing the tab.....in 400-500 status ')
                        console.log(status + ' error');
                        sendHTML = false;
                        res.sendStatus(status);
                        console.log();
                    }
                }
                //jobapi/*/search  SRP api
                else if (response.url().match(/jobapi\/(.)*\/search/)) {
                    const status = response.status();
                    isPageReloadReq['val'] = false;
                    if (status == 200) {
                        //Hanlding 301 cases 
                        if (response.url().match(/jobs-careers/) || response.url().match(/recruitment-jobs/)) {
                            console.log('Inside 200 SRP ', dummy);
                            let responseJson = await response.json();
                            if (responseJson.statusCode == 301 && responseJson.redirectionURL) {
                                await page && !page.isClosed() && page.close();
                                console.log('closing the tab.....in 200 SRP status ', dummy);
                                sendHTML = false;
                                let requestedDomain = 'https://www.dummy.com';
                                res.redirect(301, requestedDomain + "" + responseJson.redirectionURL);
                                console.log('response is send ', dummy);
                                console.log();
                            }
                        }

                    }
                    else if ((status >= 300) && (status <= 599)) {
                        await page && !page.isClosed() && page.close();
                        console.log('closing the tab.....in 300-500 status ', dummy)
                        console.log(status + ' error', dummy);
                        sendHTML = false;
                        res.sendStatus(status + ", " + dummy);
                        console.log();
                    }
                }

            });

            // page.on('console', msg => {
            //     console.log('message ' + msg.text());
            // });

            try {
                // page.setDefaultTimeout(2000);
                await page.goto(requestedUrl, { waitUntil: 'networkidle0' });
                //await page.waitFor(5 * 1000);
                //await reloadPage(page, isPageReloadReq, 0, dummy);

                //await page.screenshot({ path: '/data/apps/jobsearch/jd-screenshot.png' });

                if (!page.isClosed()) {
                    await page.evaluate(() => {
                        console.log('inside evaluate')
                        return document.documentElement.innerHTML;
                    });

                }


                //if (!page.isClosed() && sendHTML) {
                if (!page.isClosed() && sendHTML) {
                    const body = await page.content();
                    res.send(body);
                    console.log('response is send', dummy);
                    console.log();
                    t3 = new Date();
                    //console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@responded back ', t3 - t1);

                }

            }
            catch (e) {
                //Navigation failed because browser has disconnected!
                //Navigation fail error- Not an issue- 301 cases
                console.log(e);
            }

        } catch (err) {
            console.log(err, dummy);
            //await browser.close();
            //await page.close();
        }
        finally {
            pendingRequest--;
            console.log("No of pending request " + pendingRequest);
            //await browser.close();
            //console.log('closing the tab.....in finally')
            try {
                // await har.stop();
                await page && !page.isClosed() && page.close();
                t4 = new Date();
                console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@browser opening time ", t2 - t1, dummy);
                console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@responded back ', t3 - t2, dummy);
                console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@browser close time ", t4 - t3, dummy);
                console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@Total time ', t4 - t1, dummy);
                console.log('-------------------------------------------');
            }
            catch (error) {
                //console.log(error);
            }

        }

    };


}

async function reloadPage(page, isPageReloadReq, reloadTryCount, dummy) {
    console.log('Checking reloadPage.........................', dummy)
    if (isPageReloadReq['val'] && reloadTryCount <= 5) {
        console.log('################################################## reload page TryCount ', reloadTryCount, dummy);
        reloadTryCount++;
        await page.reload({ waitUntil: 'networkidle0' });
        await reloadPage(page, isPageReloadReq, reloadTryCount, dummy);
    }
}


app.listen(port, () => console.log(`Server is up`))

