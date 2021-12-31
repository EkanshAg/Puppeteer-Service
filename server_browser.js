const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const axios = require('axios');
import getStaticUrl from './generateUrl'; //Referred from static7/121
import { fetchDropdownLabel } from './dropdown'; //Referred from static7/121
const args = process.argv;
var port = args[2] || 8888;

let pendingRequest = 0;

process.setMaxListeners(Infinity); // <== Important line

app.get('*', async (req, res) => {
    let browser = null;
    try {
        pendingRequest++;

        console.log('New Request is received......');
        console.log(req.originalUrl);

        if (req.originalUrl.match('favicon')) {
            res.sendStatus(404);
            return;
        }

        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors', '--enable-features=NetworkService'] });
        console.log('New Browser is opened........................')



        let page = await browser.newPage();

        //let requestedUrl = req.protocol + '://' + req.get('Host') + req.url;
        let requestedUrl = 'https://www.naukri.com' + req.originalUrl;

        //let requestedUrl='https://www.naukri.com/job-listings-211019906694';

        //let requestedUrl = 'https://service-v8.resdex.com' + req.originalUrl;
        //let requestedUrl = 'http://172.10.130.151:8080' + req.originalUrl;
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
            if (resType === 'image' || resType === 'font' || resType === 'other' ||
                reqUrl.match('naukri.com/uba') || reqUrl.match('googletagmanager.com/gtm.js') || reqUrl.match('nLoggerJB')) {
                request.abort();
            }
            else if (request.url().match(/job-listings-*/)) {
                const jobId = request.url().match(/job-listings-[a-zA-Z0-9\-]*([0-9]{12}).*/);
                if (jobId == null) {
                    sendHTML = false;
                    let requestedDomain = 'https://www.naukri.com';
                    console.log("redirect " + requestedDomain);
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


        page.on('response', response => {
            //console.log('response url ' + response.url());
            ///jobapi|jd-api -> JD API
            if (response.url().match(/jobapi/)) {
                const status = response.status();

                //console.log("status" + status);
                if ((status >= 300) && (status <= 399)) {
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
                                let requestedDomain = 'https://www.naukri.com';
                                //console.log(requestedUrl);
                                res.redirect(301, requestedDomain + "/" + redirectUrl);
                                console.log('response is send');
                                console.log();

                            }
                            else {
                                console.log(error);
                                console.log("redirecting to jobs in india");
                                res.redirect(301, "https://www.naukri.com/jobs-in-india");
                            }
                        });
                }
                else if ((status >= 400) && (status <= 599)) {
                    console.log(status + ' error');
                    sendHTML = false;
                    res.sendStatus(status);
                    console.log();
                }
            }

        });

        page.on('console', msg => {
            //console.log('message ' + msg.text());
        });

        try {
            await page.goto(requestedUrl, { waitUntil: 'networkidle2' });

            //await page.screenshot({ path: '/data/apps/jobsearch/jd-screenshot.png' });

            await page.evaluate(() => {
                return document.documentElement.innerHTML;
            });

            const body = await page.content();

            if (sendHTML) {
                res.send(body);
                console.log('response is send');
                await page.close();
                console.log('closing the tab.....');
                console.log();
            }
        }
        catch (e) {
            //console.log(e);
        }


    } catch (err) {
        console.log(err);
        //await browser.close();
    }
    finally {
        await browser && browser.close();
        console.log('closing the browser.............');
        pendingRequest--;
        console.log("No of pending request " + pendingRequest);
        console.log();
    }


});





app.listen(port, () => console.log(`Server is up`))

