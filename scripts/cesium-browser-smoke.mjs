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
    page.on("request", (request) => requestedUrls.push(request.url()));
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

    if (route === "/satellite") {
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

          await page.waitForFunction(
            (expected) => {
              const debug = window.__SENTINEL_GLOBAL_DEBUG__;
              return Boolean(debug?.ready) && debug?.mode === expected;
            },
            mode,
            { timeout: 15000 },
          );

          const bodyText = await page.locator("body").innerText();
          if (!bodyText.includes(label)) {
            throw new Error(`${route}: mode did not settle on ${label}, cycle ${cycle}`);
          }

          const debug = await page.evaluate(
            () => window.__SENTINEL_GLOBAL_DEBUG__ ?? null,
          );
          if (!debug || !debug.ready || debug.mode !== mode) {
            throw new Error(`${route}: invalid debug state for ${label}: ${JSON.stringify(debug)}`);
          }
          if (debug.layerCount > 2) {
            throw new Error(`${route}: imagery layer leak detected: ${JSON.stringify(debug)}`);
          }

          if (
            mode === "map" &&
            (!debug.mapVisible || debug.imageryVisible || !debug.labelsVisible)
          ) {
            throw new Error(`MAP isolation failed: ${JSON.stringify(debug)}`);
          }
          if (
            mode === "satellite-labels" &&
            (debug.mapVisible || !debug.imageryVisible || !debug.labelsVisible)
          ) {
            throw new Error(`SATELLITE+LABELS isolation failed: ${JSON.stringify(debug)}`);
          }
          if (
            mode === "satellite-clean" &&
            (debug.mapVisible || !debug.imageryVisible || debug.labelsVisible)
          ) {
            throw new Error(`SATELLITE CLEAN isolation failed: ${JSON.stringify(debug)}`);
          }

          const canvas = page.locator("canvas").first();
          const box = await canvas.boundingBox();
          if (!box) throw new Error(`${route}: canvas bounding box unavailable`);

          await page.mouse.move(
            box.x + box.width * 0.35,
            box.y + box.height * 0.50,
          );
          await page.mouse.down({ button: "left" });
          await page.mouse.move(
            box.x + box.width * 0.55,
            box.y + box.height * 0.42,
            { steps: 12 },
          );
          await page.mouse.up({ button: "left" });
          await page.waitForTimeout(350);

          const rotatedDebug = await page.evaluate(
            () => window.__SENTINEL_GLOBAL_DEBUG__ ?? null,
          );
          if (!rotatedDebug || rotatedDebug.mode !== mode) {
            throw new Error(
              `${route}: rotation changed active mode: ${JSON.stringify(rotatedDebug)}`,
            );
          }
        }
      }

      const canvas = page.locator("canvas").first();
      await canvas.hover({ position: { x: 720, y: 450 } });
      await page.mouse.wheel(0, -900);
      await page.waitForTimeout(500);
      const afterZoomIn = await page.evaluate(
        () => window.__SENTINEL_GLOBAL_DEBUG__ ?? null,
      );
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(500);
      const afterZoomOut = await page.evaluate(
        () => window.__SENTINEL_GLOBAL_DEBUG__ ?? null,
      );

      if (!afterZoomIn || !afterZoomOut || afterZoomIn.mode !== afterZoomOut.mode) {
        throw new Error(
          `${route}: wheel zoom changed mode: ${JSON.stringify({ afterZoomIn, afterZoomOut })}`,
        );
      }
    }

    const state = await page.evaluate(() => {
      const canvas =
        [...document.querySelectorAll("canvas")].find(
          (item) => item.width > 300 && item.height > 300,
        ) ?? document.querySelector("canvas");
      const gl =
        canvas?.getContext("webgl2") ?? canvas?.getContext("webgl") ?? null;
      return {
        canvas: canvas ? { width: canvas.width, height: canvas.height } : null,
        webgl: Boolean(gl),
        cesiumGlobal: Boolean(window.Cesium),
        cesiumWidget: Boolean(document.querySelector(".cesium-widget")),
        bodyHasApiKeyError: /api key required/i.test(document.body.innerText),
        globalDebug: window.__SENTINEL_GLOBAL_DEBUG__ ?? null,
      };
    });

    const forbiddenApiKeyConsole = consoleErrors.filter((item) =>
      /api key required|unauthorized|invalidcredentials|isIon is not a function/i.test(item),
    );
    const forbiddenIonRequests = requestedUrls.filter((url) =>
      /api\.cesium\.com/i.test(url),
    );
    const arcGisRequests = requestedUrls.filter((url) =>
      /arcgisonline\.com/i.test(url),
    );

    const result = {
      route,
      state,
      arcGisRequests: arcGisRequests.length,
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
      arcGisRequests.length === 0
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
