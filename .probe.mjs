import { chromium } from "@playwright/test";
import fs from "node:fs";
const routes = JSON.parse(fs.readFileSync("/tmp/routes-origin.json", "utf8")).filter((r) => r.origin === "portal" && r.path.startsWith("/products/"));
const b = await chromium.launch({ channel: "chrome" });
const bad = [];
for (const w of [1920, 1440, 390]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  for (const r of routes) {
    await p.goto("http://127.0.0.1:4321" + r.path, { waitUntil: "load", timeout: 45000 });
    const info = await p.evaluate(() => {
      const h = document.querySelector("#product-title");
      if (!h) return { err: "no h1" };
      const cs = getComputedStyle(h);
      const lines = Math.round(h.getBoundingClientRect().height / parseFloat(cs.lineHeight));
      const overflow = h.scrollWidth - h.clientWidth;
      const text = h.textContent.trim();
      const rects = [...h.getClientRects()].length;
      return { text, lines, rects, overflow, fs: parseFloat(cs.fontSize), w: Math.round(h.getBoundingClientRect().width) };
    });
    if (info.err || info.overflow > 1 || info.lines > 2) bad.push(`${w} ${r.path} ${JSON.stringify(info)}`);
  }
  await p.close();
}
console.log("product routes", routes.length, "violations", bad.length);
bad.slice(0, 12).forEach((x) => console.log(x));
await b.close();