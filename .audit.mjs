import { chromium } from "@playwright/test";
const routes = ["/", "/products/", "/products/mindone/", "/products/mindone/compare/", "/industries/", "/solutions/", "/solutions/education/", "/services/", "/procurement-software/", "/offline-first-software/", "/engineering/", "/about/", "/trust/", "/faq/", "/contact/", "/privacy/", "/terms/", "/resources/", "/industries/education/", "/learning/", "/network/"];
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
p.on("console", m => { if (m.type() === "error") errors.push(m.text().slice(0, 120)); });
for (const r of routes) {
  errors.length = 0;
  const res = await p.goto("http://127.0.0.1:4321" + r, { waitUntil: "networkidle", timeout: 30000 }).catch(() => null);
  await p.waitForTimeout(250);
  const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, chars: document.querySelector("main")?.innerText.length ?? 0, h1: document.querySelectorAll("h1").length }));
  const status = res ? res.status() : 0;
  const flags = [];
  if (status !== 200) flags.push("HTTP " + status);
  if (m.chars < 800) flags.push("thin(" + m.chars + ")");
  if (m.sw > m.iw + 1) flags.push("overflow " + m.sw + "/" + m.iw);
  if (m.h1 !== 1) flags.push("h1=" + m.h1);
  if (errors.length) flags.push("console:" + errors.length);
  console.log((flags.length ? "FAIL " : "ok   ") + r + " " + flags.join(" | "));
}
await b.close();