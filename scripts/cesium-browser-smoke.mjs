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

  return {
    status: response.status(),
    contentType,
    source,
    bytes: body.length,
  };
}

async function globalImageryState(page) {
  return page.evaluate(() => {
    const viewer = window.__SENTINEL_GLOBAL_VIEWER__;
    if (!viewer) return null;
    const layers = viewer.imageryLayers?._layers ?? [];
    return {
      totalLayers: layers.length,
      visibleLayers: layers.filter((layer) => layer.show).length,
    };
  });
}

const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=swiftshader", "--disable-gpu-sandbox"],
});

try {
  for (const route of ["/test-globe", "/satellite", "/global"]) {
    console.log(`\n=== TEST ${route} ===`);

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

    await page.goto(`${baseUrl}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForFunction(
      () => Boolean(window.Cesium) || Boolean(document.querySelector(".cesium-widget")),
      { timeout: 60000 },
    );

    await page.waitForSelector("canvas", { timeout: 30000 });
    await page.waitForTimeout(3000);

    if (route === "/test-globe" && requireTestGlobeImagery) {
      await page.waitForFunction(
        () => window.__SENTINEL_TEST_GLOBE__?.imagery === "READY",
        { timeout: 60000 },
      );
    }

    const mapTile = route !== "/test-globe" ? await checkMapTile(page) : null;

    const zoomControls = await page.evaluate(() => ({
      zoomIn: Boolean(document.querySelector('[data-testid="global-zoom-in"]')),
      zoomOut: Boolean(document.querySelector('[data-testid="global-zoom-out"]')),
    }));

    const zoomChanged = route !== "/test-globe"
      ? await page.evaluate(async () => {
          const viewer = window.__SENTINEL_GLOBAL_VIEWER__;
          if (!viewer) return false;
          const before = viewer.camera.positionCartographic.height;
          document.querySelector('[data-testid="global-zoom-in"]')?.click();
          await new Promise((resolve) => setTimeout(resolve, 100));
          const after = viewer.camera.positionCartographic.height;
          return after < before;
        })
      : true;

    let testGlobeModeChecks = null;
    if (route === "/test-globe") {
      const clickMode = async (name) => {
        await page.getByRole("button", { name }).click();
        await page.waitForTimeout(600);
        return page.evaluate(() => ({
          imagery: window.__SENTINEL_TEST_GLOBE__?.imagery ?? null,
          visibleLayers: window.__SENTINEL_TEST_GLOBE_VISIBLE_LAYERS__ ?? null,
        }));
      };

      testGlobeModeChecks = {
        map: await clickMode(/MAP \+ CITY LABELS/),
        satelliteLabels: await clickMode(/SATELLITE \+ CITY LABELS/),
        satelliteClean: await clickMode(/SATELLITE CLEAN/),
      };
    }

    const state = await page.evaluate(() => {
      const canvases = [...document.querySelectorAll("canvas")];
      const canvas = canvases.find((item) => item.width > 300 && item.height > 300) ?? canvases[0] ?? null;
      const gl = canvas?.getContext("webgl2") ?? canvas?.getContext("webgl") ?? null;
      return {
        canvas: canvas ? { width: canvas.width, height: canvas.height } : null,
        webgl: Boolean(gl),
        cesiumGlobal: Boolean(window.Cesium),
        cesiumWidget: Boolean(document.querySelector(".cesium-widget")),
        imagery: window.__SENTINEL_TEST_GLOBE__?.imagery ?? null,
      };
    });

    const result = {
      route,
      state,
      mapTile,
      zoomControls,
      zoomChanged,
      testGlobeModeChecks,
      requireTestGlobeImagery,
      consoleErrors,
      pageErrors,
      failedRequests,
    };

    console.log(JSON.stringify(result, null, 2));

    const badMapSource = Boolean(
      mapTile?.source?.includes("WORLD-IMAGERY"),
    );

    const modeIsolationFailed =
      route === "/test-globe" &&
      Object.values(testGlobeModeChecks ?? {}).some(
        (item) => item?.visibleLayers !== 1 || item?.imagery !== "READY",
      );

    if (
      !state.canvas ||
      !state.webgl ||
      !state.cesiumGlobal ||
      !state.cesiumWidget ||
      consoleErrors.length > 0 ||
      pageErrors.length > 0 ||
      failedRequests.length > 0 ||
      !zoomControls.zoomIn ||
      !zoomControls.zoomOut ||
      !zoomChanged ||
      modeIsolationFailed ||
      (route === "/test-globe" && requireTestGlobeImagery && state.imagery !== "READY") ||
      (route !== "/test-globe" &&
        (!mapTile || mapTile.status !== 200 || !mapTile.contentType.startsWith("image/") || !mapTile.source || mapTile.bytes <= 0 || badMapSource))
    ) {
      throw new Error(`${route} failed Cesium browser smoke: ${JSON.stringify(result)}`);
    }

    await page.screenshot({
      path: `.artifacts/cesium${
        route === "/test-globe" ? "-control" : route === "/satellite" ? "-satellite" : "-global"
      }.png`,
      fullPage: true,
    });

    await page.close();
  }

  console.log("\nCESIUM BROWSER SMOKE PASS");
} finally {
  await browser.close();
}
