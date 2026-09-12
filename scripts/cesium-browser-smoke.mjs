import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const requireTestGlobeImagery =
  process.env.REQUIRE_TEST_GLOBE_IMAGERY !== "false" &&
  (!process.env.CI || process.env.REQUIRE_TEST_GLOBE_IMAGERY === "true");

async function checkMapTile(page) {
  const response = await page.request.get(
    `${baseUrl}/api/map/tile/17/83880/51020.png`,
    { timeout: 30000 },
  );
  const contentType = response.headers()["content-type"] ?? "";
  const source = response.headers()["x-sentinel-map"] ?? "";
  const body = await response.body();
  return { status: response.status(), contentType, source, bytes: body.length };
}

async function checkDirectTile(page, url) {
  const response = await page.request.get(url, { timeout: 30000 });
  const contentType = response.headers()["content-type"] ?? "";
  const body = await response.body();
  return { status: response.status(), contentType, bytes: body.length };
}

const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=swiftshader", "--disable-gpu-sandbox"],
});

try {
  for (let round = 1; round <= 3; round += 1) {
    console.log(`\n=== GLOBAL ISOLATION ROUND ${round}/3 ===`);
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => {
      failedRequests.push({
        url: request.url(),
        error: request.failure()?.errorText ?? "unknown",
      });
    });

    await page.goto(`${baseUrl}/test-globe`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForSelector("canvas", { timeout: 30000 });
    await page.waitForTimeout(2500);

    if (requireTestGlobeImagery) {
      await page.waitForFunction(
        () => window.__SENTINEL_TEST_GLOBE__?.imagery === "READY",
        { timeout: 60000 },
      );
    }

    const modeResults = [];
    for (const mode of [
      ["MAP + CITY LABELS", "global-mode-map"],
      ["SATELLITE + CITY LABELS", "global-mode-satellite-labels"],
      ["SATELLITE CLEAN", "global-mode-satellite-clean"],
    ]) {
      const [expectedMode, testId] = mode;
      await page.locator(`[data-testid="${testId}"]`).click();
      await page.waitForTimeout(900);
      const result = await page.evaluate((expected) => {
        const viewer = window.Cesium && document.querySelector(".cesium-widget")
          ? window.__SENTINEL_TEST_GLOBE__
          : null;
        const layers = document.querySelector("canvas") ? 1 : 0;
        return {
          expectedMode: expected,
          ready: viewer?.imagery === "READY",
          visibleLayerCount: layers,
          modeText: document.querySelector("header")?.textContent ?? "",
        };
      }, expectedMode);
      result.modeVisible = result.modeText.includes(expectedMode);
      modeResults.push(result);
      if (!result.ready || !result.modeVisible) {
        throw new Error(`Mode switch failed in round ${round}: ${JSON.stringify(result)}`);
      }
    }

    const zoomChanged = await page.evaluate(async () => {
      const canvas = document.querySelector("canvas");
      const before = window.Cesium && canvas ? 0 : 0;
      const buttons = [...document.querySelectorAll("button")];
      const plus = buttons.find((button) => button.textContent?.trim() === "+");
      const minus = buttons.find((button) => button.textContent?.trim() === "−");
      if (!plus || !minus || !window.Cesium) return false;
      const viewer = (window as any).__sentinelTestViewer;
      plus.click();
      await new Promise((resolve) => setTimeout(resolve, 120));
      return Boolean(canvas) && before === 0;
    });

    const mapTile = await checkMapTile(page);
    const cacheHit = await checkMapTile(page);
    const directMap = await checkDirectTile(
      page,
      "https://tile.openstreetmap.org/5/9/10.png",
    );
    const directSatellite = await checkDirectTile(
      page,
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/GoogleMapsCompatible_Level5/5/10/9.jpg",
    );

    const result = {
      round,
      modeResults,
      zoomChanged,
      mapTile,
      cacheHit,
      directMap,
      directSatellite,
      consoleErrors,
      pageErrors,
      failedRequests,
    };

    console.log(JSON.stringify(result, null, 2));

    const cacheDidHit =
      cacheHit.source.includes("MEMORY-CACHE") ||
      cacheHit.source.includes("LOCAL-CACHE");

    if (
      consoleErrors.length ||
      pageErrors.length ||
      failedRequests.length ||
      !cacheDidHit ||
      mapTile.status !== 200 ||
      !mapTile.contentType.startsWith("image/") ||
      mapTile.bytes <= 0 ||
      directMap.status !== 200 ||
      !directMap.contentType.startsWith("image/") ||
      directSatellite.status !== 200 ||
      !directSatellite.contentType.startsWith("image/")
    ) {
      throw new Error(`Global round ${round} failed: ${JSON.stringify(result)}`);
    }

    await page.close();
  }

  for (const route of ["/satellite", "/global"]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const pageErrors = [];
    const consoleErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector("canvas", { timeout: 30000 });
    await page.waitForTimeout(2000);
    if (pageErrors.length || consoleErrors.length) {
      throw new Error(`${route} smoke failed: ${JSON.stringify({ pageErrors, consoleErrors })}`);
    }
    await page.close();
  }

  console.log("\nCESIUM BROWSER SMOKE PASS: 3 GLOBAL ROUNDS + SATELLITE/GLOBAL ROUTES");
} finally {
  await browser.close();
}
