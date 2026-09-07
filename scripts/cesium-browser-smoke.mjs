import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=swiftshader", "--disable-gpu-sandbox"],
});

try {
  for (const route of ["/test-globe", "/satellite"]) {
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
} finally {
  await browser.close();
}
