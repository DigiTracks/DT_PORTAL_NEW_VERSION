import { chromium } from "@playwright/test";
const routes = ["/", "/sourcecraft/", "/learnpmo/", "/procuresherpa/", "/hcmfusion/", "/privacy/", "/terms/"];
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
for (const r of routes) {
  const res = await p.goto("http://127.0.0.1:4322" + r, { waitUntil: "networkidle", timeout: 30000 }).catch(() => null);
  await p.waitForTimeout(250);
  const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, chars: document.querySelector("main")?.innerText.length ?? 0, h1: document.querySelectorAll("h1").length }));
  const flags = [];
  if (!res || res.status() !== 200) flags.push("HTTP " + (res ? res.status() : 0));
  if (m.chars < 800) flags.push("thin(" + m.chars + ")");
  if (m.sw > m.iw + 1) flags.push("overflow");
  console.log((flags.length ? "FAIL " : "ok   ") + r + " " + flags.join(" | "));
}
await b.close();