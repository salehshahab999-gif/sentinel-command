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
    await page.waitForTimeout(2000);

    if (requireTestGlobeImagery) {
      await page.waitForFunction(
        () => window.__SENTINEL_TEST_GLOBE__?.imagery === "READY",
        { timeout: 60000 },
      );
    }

    const modes = [
      ["global-mode-map", "MAP + CITY LABELS"],
      ["global-mode-satellite-labels", "SATELLITE + CITY LABELS"],
      ["global-mode-satellite-clean", "SATELLITE CLEAN"],
    ];

    for (const [testId, expectedMode] of modes) {
      await page.locator(`[data-testid="${testId}"]`).click();
      await page.waitForTimeout(700);
      const result = await page.evaluate((expected) => ({
        expected,
        mode: document.querySelector("header")?.textContent ?? "",
        imagery: window.__SENTINEL_TEST_GLOBE__?.imagery ?? null,
      }), expectedMode);

      if (!result.mode.includes(expected) || (requireTestGlobeImagery && result.imagery !== "READY")) {
        throw new Error(`Mode isolation failed in round ${round}: ${JSON.stringify(result)}`);
      }
    }

    const mapTile = await checkMapTile(page);
    const cacheHit = await checkMapTile(page);
    const cacheWorking =
      cacheHit.source.includes("MEMORY-CACHE") ||
      cacheHit.source.includes("LOCAL-CACHE");

    const result = {
      round,
      mapTile,
      cacheHit,
      cacheWorking,
      consoleErrors,
      pageErrors,
      failedRequests,
    };

    console.log(JSON.stringify(result, null, 2));

    if (
      consoleErrors.length > 0 ||
      pageErrors.length > 0 ||
      failedRequests.length > 0 ||
      mapTile.status !== 200 ||
      !mapTile.contentType.startsWith("image/") ||
      mapTile.bytes <= 0 ||
      !cacheWorking
    ) {
      throw new Error(`Global round ${round} failed: ${JSON.stringify(result)}`);
    }

    await page.close();
  }

  for (const route of ["/satellite", "/global"]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const consoleErrors = [];
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector("canvas", { timeout: 30000 });
    await page.waitForTimeout(1500);
    if (consoleErrors.length || pageErrors.length) {
      throw new Error(`${route} smoke failed: ${JSON.stringify({ consoleErrors, pageErrors })}`);
    }
    await page.close();
  }

  console.log("\nCESIUM BROWSER SMOKE PASS: 3 GLOBAL ROUNDS + SATELLITE/GLOBAL ROUTES");
} finally {
  await browser.close();
}
