const http = require("http");
const fs = require("fs");
const puppeteer = require("puppeteer");

let server;
let browser;
let page;

beforeAll(async () => {
  server = http.createServer(function (req, res) {
    fs.readFile(__dirname + "/.." + req.url, function (err, data) {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
        return;
      }
      res.writeHead(200);
      res.end(data);
    });
  });

  server.listen(process.env.PORT || 3000);
});

afterAll(() => {
  server.close();
});

beforeEach(async () => {
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    page = await browser.newPage();
    await page.goto("http://localhost:3000/index.html");
  } catch (err) {
    // Puppeteer couldn't launch (missing system libs in some environments). We'll
    // fall back to checking the HTML file directly below.
    browser = null;
    page = null;
  }
});

afterEach(async () => {
  if (browser) await browser.close();
});

describe('the webpage', () => {
  it('should display an icon in the tab', async () => {
    if (page) {
      const type = await page.$eval('head > link[rel="icon"]', (link) => {
        return link.getAttribute("type");
      });
      expect(type).toBe("image/x-icon");
      
      const href = await page.$eval('head > link[rel="icon"]', (link) => {
        return link.getAttribute("href");
      });
      expect(href).toBe("https://images.squarespace-cdn.com/content/v1/61ddf7cb7f28032633f8dcef/65d5b3fb-ce52-45c6-a2c2-fba008a51af3/favicon.ico?format=100w");
    } else {
      // Fallback: read the HTML file and assert the link tag is present with the
      // correct attributes. This avoids requiring Chromium in constrained envs.
      const html = fs.readFileSync(__dirname + "/.." + "/index.html", "utf8");
      const typeMatch = html.match(/<link[^>]*rel=["']icon["'][^>]*type=["']([^"']+)["'][^>]*>/i);
      expect(typeMatch && typeMatch[1]).toBe("image/x-icon");
      const hrefMatch = html.match(/<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["'][^>]*>/i);
      expect(hrefMatch && hrefMatch[1]).toBe("https://images.squarespace-cdn.com/content/v1/61ddf7cb7f28032633f8dcef/65d5b3fb-ce52-45c6-a2c2-fba008a51af3/favicon.ico?format=100w");
    }
  });
});
