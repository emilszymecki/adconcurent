const puppeteer = require("puppeteer");

const list = require("./list");

const regExp = new RegExp(
  /https:\/\/a.spolecznosci\.net\/core\/.*\/main\.js/,
  "g"
);

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  for (const link of list) {
    try{

    try {
      await page.goto(`https://${link}`, { waitUntil: "networkidle2" });
    } catch (error) {
      await page.goto(`http://${link}`, { waitUntil: "networkidle2" });
    }

    await page.waitFor(5000);

    const scriptTag = await page.evaluate(() => {
      const scriptSRC = [...document.querySelectorAll("script")].flatMap(x => [x.src,x.innerHTML]);
      return scriptSRC;
    });


    const matchScriptTag = scriptTag
      .filter(x => regExp.test(x))
      .flatMap(x => x.match(regExp));

    const uniqueMatchScriptTag = [...new Set(matchScriptTag)];

    console.log(link,(uniqueMatchScriptTag.length ? uniqueMatchScriptTag[0]: "NONE_MAIN"));
    }catch{
        console.log(link,"ERROR")
    }
  }

  await browser.close();
})();
