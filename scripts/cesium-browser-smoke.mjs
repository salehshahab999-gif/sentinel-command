<<<<<<< HEAD
﻿import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";

=======
import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
>>>>>>> 6bb5105c40394eb5ee86b3497d6ea85f657e7116
const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=swiftshader", "--disable-gpu-sandbox"],
});

try {
  for (const route of ["/test-globe", "/satellite"]) {
<<<<<<< HEAD
    console.log(`\n=== TEST ${route} ===`);

    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });

    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
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
      () =>
        Boolean(window.Cesium) ||
        Boolean(document.querySelector(".cesium-widget")),
      { timeout: 60000 }
    );

    await page.waitForSelector("canvas", {
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    const state = await page.evaluate(() => {
      const canvases = [...document.querySelectorAll("canvas")];

      const canvas =
        canvases.find(
          (item) => item.width > 300 && item.height > 300
        ) ??
        canvases[0] ??
        null;

      const gl =
        canvas?.getContext("webgl2") ??
        canvas?.getContext("webgl") ??
        null;

      const cesiumWidget = Boolean(
        document.querySelector(".cesium-widget")
      );

      const cesiumGlobal = Boolean(window.Cesium);

      return {
        canvas: canvas
          ? {
              width: canvas.width,
              height: canvas.height,
            }
          : null,
        webgl: Boolean(gl),
        cesiumGlobal,
        cesiumWidget,
        cesiumReady: cesiumGlobal || cesiumWidget,
      };
    });

    const result = {
      route,
      state,
      consoleErrors,
      pageErrors,
      failedRequests,
    };

    console.log(JSON.stringify(result, null, 2));

    if (
      !state.canvas ||
      !state.webgl ||
      !state.cesiumReady ||
      !state.cesiumWidget
    ) {
      throw new Error(`${route} failed Cesium browser smoke`);
    }

    await page.screenshot({
      path: `.artifacts/cesium${
        route === "/test-globe"
          ? "-control"
          : "-satellite"
      }.png`,
      fullPage: true,
    });

    await page.close();
  }

  console.log("\nCESIUM BROWSER SMOKE PASS");
=======
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForFunction(() => Boolean(window.Cesium), { timeout: 30_000 });
    await page.waitForSelector("canvas", { timeout: 30_000 });
    await page.waitForTimeout(5000);

    const state = await page.evaluate(() => {
      const canvases = [...document.querySelectorAll("canvas")];
      const canvas = canvases.find((item) => item.width > 300 && item.height > 300) ?? canvases[0] ?? null;
      const gl = canvas?.getContext("webgl2") ?? canvas?.getContext("webgl") ?? null;
      return {
        canvas: canvas ? { width: canvas.width, height: canvas.height } : null,
        webgl: Boolean(gl),
        cesium: Boolean(window.Cesium),
        cesiumWidget: Boolean(document.querySelector(".cesium-widget")),
      };
    });

    if (!state.canvas || !state.webgl || !state.cesium || !state.cesiumWidget) {
      throw new Error(`${route} failed Cesium browser smoke: ${JSON.stringify(state)}`);
    }

    await page.screenshot({ path: `.artifacts/cesium${route === "/test-globe" ? "-control" : "-satellite"}.png`, fullPage: true });
    console.log(JSON.stringify({ route, state, consoleErrors }, null, 2));
    await page.close();
  }
>>>>>>> 6bb5105c40394eb5ee86b3497d6ea85f657e7116
} finally {
  await browser.close();
}
