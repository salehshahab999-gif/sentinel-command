import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=swiftshader", "--disable-gpu-sandbox"],
});

const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
});

const consoleMessages = [];
const pageErrors = [];
const failedRequests = [];
const cesiumRequests = [];
const cesiumResponses = [];

page.on("console", (message) => {
  consoleMessages.push({
    type: message.type(),
    text: message.text(),
  });
});

page.on("pageerror", (error) => {
  pageErrors.push(error.message);
});

page.on("request", (request) => {
  const url = request.url();

  if (url.includes("cesium.com")) {
    cesiumRequests.push({
      method: request.method(),
      url,
      resourceType: request.resourceType(),
    });
  }
});

page.on("response", (response) => {
  const url = response.url();

  if (url.includes("cesium.com")) {
    cesiumResponses.push({
      status: response.status(),
      url,
    });
  }
});

page.on("requestfailed", (request) => {
  const url = request.url();

  failedRequests.push({
    url,
    error: request.failure()?.errorText ?? "unknown",
  });
});

await page.goto("http://127.0.0.1:3000/test-globe", {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});

await page.waitForTimeout(10000);

const info = await page.evaluate(() => ({
  title: document.title,
  readyState: document.readyState,

  cesiumGlobal: Boolean(window.Cesium),

  cesiumScripts: [...document.scripts]
    .map((script) => script.src)
    .filter((src) => src.toLowerCase().includes("cesium")),

  widgets: document.querySelectorAll(".cesium-widget").length,

  canvases: document.querySelectorAll("canvas").length,

  divCount: document.querySelectorAll("div").length,

  bodyHtml: document.body.innerHTML.slice(0, 2500),

  effectMarker: Boolean(
    [...document.querySelectorAll("*")].some((element) =>
      element.textContent?.includes("CESIUM_TEST_EFFECT_STARTED"),
    ),
  ),

  headScripts: [...document.head.querySelectorAll("script")]
    .map((script) => ({
      src: script.src,
      async: script.async,
      defer: script.defer,
    })),
}));

console.log(
  JSON.stringify(
    {
      info,
      consoleMessages,
      pageErrors,
      failedRequests,
      cesiumRequests,
      cesiumResponses,
    },
    null,
    2,
  ),
);

await page.screenshot({
  path: ".artifacts/test-globe-debug.png",
  fullPage: true,
});

await browser.close();