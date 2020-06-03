const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "final.json");
const {
  fullLists,
  PuppeteerBlocker,
  Request,
  FiltersEngine
} = require("@cliqz/adblocker-puppeteer");
const fetch = require("cross-fetch");
const parseDomain = require("parse-domain");
const chalk = require("chalk");
const inquirer = require("inquirer");
const { PendingXHR } = require("pending-xhr-puppeteer");

//console.log(dir);

(async () => {
  const getSite = await inquirer.prompt({
    type: "input",
    name: "url",
    message: "Podaj url"
  });

  console.log("Czekaj ...")

  const rawdata = await fs.readFileSync(dir);
  const data = JSON.parse(rawdata);
  let detect = new Set();

  const blocker = await FiltersEngine.fromLists(
    fetch,
    [
      "https://raw.githubusercontent.com/hl2guide/All-in-One-Customized-Adblock-List/master/aio.txt"
    ],
    {
      enableCompression: true
    }
  );

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--start-maximized"]
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1920,
    height: 1080
  });
  const pendingXHR = new PendingXHR(page);

  page.on("request", request => {
    const domain = parseDomain(request._url) || "";
    var textDomain = `${domain.domain}.${domain.tld}` || "";
    if (domain.domain){
      detect.add(textDomain);
    }
    blocker.match(Request.fromRawDetails({ url: request.url() }));
  });

  blocker.on("request-blocked", request => {
    const { domain, hostname, url } = request;
    detect.add(domain);
  });

  await page.goto(getSite.url, {
    waitUntil: "networkidle2"
  });
  await pendingXHR.waitForAllXhrFinished();
  await page.waitFor(5000);
  await browser.close();

  const reportDetect = [...detect].map(x => {
    const searchData = data.find(y => y.domain == x);
    if (!searchData) {
      return { domain: x, categories: ["not_Adblock"] };
    }
    return searchData;
  });

  reportDetect.forEach(x => {
    let { domain, categories } = x;
    if (!categories.length) {
      categories = "NOT_DEFINED";
    }
    if (categories.includes("not_Adblock")) {
      console.log(`${chalk.black.bgGreen.bold([domain])}: ${categories} \n`);
    } else {
      console.log(`${chalk.white.bgRed.bold([domain])}: ${categories} \n`);
    }
  });

})();
