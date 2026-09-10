import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";

async function checkMapTile(page, mode) {
  const response = await page.request.get(
    `${baseUrl}/api/map/tile/17/83880/51020.png?mode=${mode}`,
    { timeout: 30000 },
  );

  const headers = response.headers();
  const contentType = headers["content-type"] ?? "";
  const source = headers["x-sentinel-map"] ?? "";
  const body = await response.body();

  return {
    mode,
    status: response.status(),
    contentType,
    source,
    bytes: body.length,
  };
}

function assertTileMode(tile) {
  if (
    tile.status !== 200 ||
    !tile.contentType.startsWith("image/") ||
    !tile.source ||
    tile.bytes <= 0
  ) {
    throw new Error(`Invalid tile result: ${JSON.stringify(tile)}`);
  }

  if (tile.mode === "map" && !tile.source.includes("OSM-STANDARD")) {
    throw new Error(`MAP resolved to an unexpected provider: ${JSON.stringify(tile)}`);
  }

  if (tile.mode === "imagery" && !tile.source.includes("ESRI-WORLD-IMAGERY")) {
    throw new Error(`IMAGERY resolved to an unexpected provider: ${JSON.stringify(tile)}`);
  }

  if (tile.mode === "labels" && !tile.source.includes("ESRI-BOUNDARIES-PLACES")) {
    throw new Error(`LABELS resolved to an unexpected provider: ${JSON.stringify(tile)}`);
  }
}

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
      const url = request.url();
      requestedUrls.push(url);
      if (route === "/satellite" && url.includes("api.cesium.com")) {
        consoleErrors.push(`UNEXPECTED_CESIUM_ION_REQUEST: ${url}`);
      }
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

    const mapTiles = [];

    if (route === "/satellite") {
      for (const mode of ["map", "imagery", "labels"]) {
        const tile = await checkMapTile(page, mode);
        assertTileMode(tile);
        mapTiles.push(tile);
      }

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
          await page.waitForTimeout(600);

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

    const forbiddenApiKeyConsole = consoleErrors.filter((item) => /api key required|unauthorized|invalidcredentials/i.test(item));
    const forbiddenIonRequests = route === "/satellite"
      ? requestedUrls.filter((url) => url.includes("api.cesium.com"))
      : [];

    const result = {
      route,
      state,
      mapTiles,
      consoleErrors,
      pageErrors,
      failedRequests,
      forbiddenApiKeyConsole,
      forbiddenIonRequests,
    };

    console.log(JSON.stringify(result, null, 2));

    if (
      !state.canvas ||
      !state.webgl ||
      !state.cesiumGlobal ||
      !state.cesiumWidget ||
      pageErrors.length > 0 ||
      (route === "/satellite" && (
        consoleErrors.length > 0 ||
        state.bodyHasApiKeyError ||
        forbiddenApiKeyConsole.length > 0 ||
        forbiddenIonRequests.length > 0 ||
        failedRequests.some(({ url }) => url.includes("/api/map/tile/") || url.includes("api.cesium.com"))
      ))
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
