const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const axios = require('axios');
import getStaticUrl from './generateUrl'; //Referred from static7/121
const args = process.argv;
//const browser = null;
var port = args[2] || 8888;
let browser = null;

createBrowserInstance();

async function createBrowserInstance() {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors', '--enable-features=NetworkService'] });
    console.log('New Browser is opened........................')
    app.get('*', async (req, res) => {
        console.log('New Request is received......');
        let tabs = await browser.pages();
        console.log('No of opened tabs -', tabs.length);
        let page = null;
        try {
            page = await browser.newPage();
            //page.setExtraHTTPHeaders({proxy_addr: "http://webproxy.ieil.net", proxy_port: "8081"});
            const headers = req.headers;
            const platform = headers['platform'];
            if (platform == 'mobile') {
                page.setUserAgent('Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.76 Mobile Safari/537.36');
            }

            //let requestedUrl = req.protocol + '://' + req.get('Host') + req.url;
            let requestedUrl = 'https://www.dummy.com' + req.originalUrl;
            //let requestedUrl = 'https://service-v8.resdex.com' + req.originalUrl;
            //let requestedUrl = 'http://172.10.130.151:8080' + req.originalUrl;
            //console.log("Requested Url:- ", requestedUrl);
            //const local_url = 'https://learning.dummy.com' + req.originalUrl;
            // Intercept API response and pass mock data for Puppeteer
            await page.setRequestInterception(true);
            let sendHTML = true;
            page.on('request', request => {
                //JD
                //console.log(request.url());
                if (request.url().match(/job-listings-*/)) {
                    const jobId = request.url().match(/job-listings-[a-zA-Z0-9\-]*([0-9]{12}).*/);
                    if (jobId == null) {
                        sendHTML = false;
                        let requestedDomain = req.protocol + '://' + req.get('Host');
                        console.log("redirect " + requestedDomain);
                        res.redirect(301, requestedDomain);
                    }
                    else {
                        request.continue();
                    }
                }

                else {
                    request.continue();
                }

            });


            page.on('response', response => {
                console.log('response url ' + response.url());
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
                                console.log('3xx error');
                                //console.log(error.response.data)
                                if (error.response && error.response.data && error.response.data.metaSearch) {
                                    let metaSearch = error.response.data.metaSearch;
                                    let redirectUrl = getStaticUrl(metaSearch.keywords, metaSearch.city);
                                    //  console.log(redirectUrl);
                                    let requestedDomain = req.protocol + '://' + req.get('Host');
                                    //console.log(requestedUrl);
                                    res.redirect(301, requestedDomain + "/" + redirectUrl);
                                    console.log('response is send');
                                    console.log();
                                    //await page.close();
                                }
                            });
                    }
                    else if ((status >= 400) && (status <= 599)) {
                        console.log(status + ' error');
                        sendHTML = false;
                        res.sendStatus(status);

                    }
                }

            });

            page.on('console', msg => {
                console.log('message ' + msg.text());
            });

            await page.goto(requestedUrl, { waitUntil: 'networkidle0' });

            //await page.screenshot({ path: '/data/apps/jobsearch/jd-screenshot.png' });

            await page.evaluate(() => {
                return document.documentElement.innerHTML;
            });


            const body = await page.content();

            //await browser.close();
            if (sendHTML) {
                res.send(body);
                console.log('response is send')
                console.log();
            }

        } catch (err) {
            console.log(err);
            //await browser.close();
            await page.close();
        } finally {
            //await browser.close();
            await page.close();
            console.log('closing the tab.....')
            console.log('No of opened tabs -', tabs.length);
        }
    });
}


app.listen(port, () => console.log(`Server is up`))

