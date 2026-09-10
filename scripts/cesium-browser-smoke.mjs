import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";

const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=swiftshader", "--disable-gpu-sandbox"],
});

try {
  for (const route of ["/test-globe", "/satellite"]) {
    console.log(`\n=== TEST ${route} ===`);

    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });

    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    const requestedUrls = [];

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    page.on("pageerror", (error) => pageErrors.push(error.message));

    page.on("request", (request) => {
      requestedUrls.push(request.url());
    });

    page.on("requestfailed", (request) => {
      failedRequests.push({
        url: request.url(),
        error: request.failure()?.errorText ?? "unknown",
      });
    });

    await page.goto(`${baseUrl}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForFunction(
      () => Boolean(window.Cesium) || Boolean(document.querySelector(".cesium-widget")),
      { timeout: 60000 },
    );

    await page.waitForSelector("canvas", { timeout: 30000 });
    await page.waitForTimeout(2500);

    if (route === "/test-globe") {
      const modeChecks = [
        ["map", "MAP + CITY LABELS"],
        ["satellite-labels", "SATELLITE + CITY LABELS"],
        ["satellite-clean", "SATELLITE CLEAN"],
      ];

      for (let cycle = 1; cycle <= 3; cycle += 1) {
        for (const [mode, label] of modeChecks) {
          const button = page.getByTestId(`global-mode-${mode}`);
          await button.waitFor({ state: "visible", timeout: 10000 });
          await button.click();
          await page.waitForTimeout(900);

          const bodyText = await page.locator("body").innerText();
          if (!bodyText.includes(label)) {
            throw new Error(`Global mode did not settle on ${label} during cycle ${cycle}`);
          }
        }
      }
    }

    const state = await page.evaluate(() => {
      const canvas = [...document.querySelectorAll("canvas")].find(
        (item) => item.width > 300 && item.height > 300,
      ) ?? document.querySelector("canvas");
      const gl = canvas?.getContext("webgl2") ?? canvas?.getContext("webgl") ?? null;
      return {
        canvas: canvas ? { width: canvas.width, height: canvas.height } : null,
        webgl: Boolean(gl),
        cesiumGlobal: Boolean(window.Cesium),
        cesiumWidget: Boolean(document.querySelector(".cesium-widget")),
        bodyHasApiKeyError: /api key required/i.test(document.body.innerText),
      };
    });

    const forbiddenApiKeyConsole = consoleErrors.filter((item) =>
      /api key required|unauthorized|invalidcredentials/i.test(item),
    );
    const forbiddenIonRequests = requestedUrls.filter((url) =>
      /api\.cesium\.com/i.test(url),
    );
    const mapProxyRequests = requestedUrls.filter((url) =>
      /\/api\/map\/tile\//i.test(url),
    );
    const arcGisRequests = requestedUrls.filter((url) =>
      /server\.arcgisonline\.com/i.test(url),
    );

    const result = {
      route,
      state,
      requestedArcGisRequests: arcGisRequests.length,
      mapProxyRequests: mapProxyRequests.length,
      forbiddenApiKeyConsole,
      forbiddenIonRequests,
      consoleErrors,
      pageErrors,
      failedRequests,
    };

    console.log(JSON.stringify(result, null, 2));

    if (
      !state.canvas ||
      !state.webgl ||
      !state.cesiumGlobal ||
      !state.cesiumWidget ||
      state.bodyHasApiKeyError ||
      pageErrors.length > 0 ||
      forbiddenApiKeyConsole.length > 0 ||
      forbiddenIonRequests.length > 0 ||
      consoleErrors.length > 0 ||
      failedRequests.some(({ url }) => /api\.cesium\.com/i.test(url)) ||
      (route === "/test-globe" && arcGisRequests.length === 0)
    ) {
      throw new Error(`${route} failed Cesium browser smoke: ${JSON.stringify(result)}`);
    }

    await page.screenshot({
      path: `.artifacts/cesium${route === "/test-globe" ? "-control" : "-satellite"}.png`,
      fullPage: true,
    });

    await page.close();
  }

  console.log("\nCESIUM BROWSER SMOKE PASS");
} finally {
  await browser.close();
}
