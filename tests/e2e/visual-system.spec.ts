import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const routes = [
  { name: "portal-home", url: "http://127.0.0.1:4321/" },
  { name: "mindone-basic", url: "http://127.0.0.1:4321/products/mindone/" },
  { name: "mindone-complete", url: "http://127.0.0.1:4321/products/mindone-pro/" },
  { name: "orion-product", url: "http://127.0.0.1:4321/products/orion/" },
  { name: "procurement-ecosystem", url: "http://127.0.0.1:4321/procurement-software/" },
  { name: "services", url: "http://127.0.0.1:4321/services/" },
  { name: "learn-home", url: "http://127.0.0.1:4322/" },
  { name: "sourcecraft-home", url: "http://127.0.0.1:4323/" },
  { name: "procuresherpa-home", url: "http://127.0.0.1:4324/" },
  { name: "learnpmo-plan", url: "http://127.0.0.1:4325/plan/" },
  { name: "hcmfusion-evidence", url: "http://127.0.0.1:4326/sources/gaps/" }
] as const;

const viewports = [
  { name: "wide", width: 1920, height: 1080 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "mobile", width: 390, height: 844 }
] as const;

async function visualMetrics(page: Page) {
  return page.evaluate(() => {
    const styleOf = (element: Element | null) => {
      const style = element ? getComputedStyle(element) : null;
      return {
        fontFamily: style?.fontFamily ?? "",
        fontSize: style?.fontSize ?? "",
        lineHeight: style?.lineHeight ?? "",
        color: style?.color ?? ""
      };
    };
    const shellWidths = [...document.querySelectorAll(".shell")].slice(0, 8).map((element) => {
      const rect = element.getBoundingClientRect();
      return { width: Math.round(rect.width), left: Math.round(rect.left), right: Math.round(rect.right) };
    });
    const isVisibleText = (element: Element) => {
      if (element instanceof SVGElement || element.closest('[aria-hidden="true"], .sr-only')) return false;
      if (element.matches("script, style, noscript, template")) return false;
      const rect = element.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return false;
      for (let current: Element | null = element; current; current = current.parentElement) {
        const style = getComputedStyle(current);
        if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse" || Number(style.opacity) === 0) return false;
      }
      return true;
    };
    const selectorFor = (element: Element) => {
      const id = element.id ? `#${CSS.escape(element.id)}` : element.tagName.toLowerCase();
      const classes = [...element.classList].slice(0, 2).map((name) => `.${CSS.escape(name)}`).join("");
      return `${id}${classes}`;
    };
    const textSamples = [...document.querySelectorAll("body *")]
      .filter((element) => [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()))
      .filter(isVisibleText)
      .map((element) => ({
        text: [...element.childNodes]
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent)
          .join("")
          .trim()
          .replaceAll(/\s+/gu, " ")
          .slice(0, 90),
        tagName: element.tagName,
        className: element.className,
        selector: selectorFor(element),
        ...styleOf(element)
      }))
      .filter((sample) => sample.text);
    const resumeSamples = textSamples.filter((sample) => sample.tagName === "SMALL" && /résumé|resume/iu.test(sample.text));
    const h1 = document.querySelector("h1");
    const firstSection = document.querySelector("main > section");
    const smallestText = textSamples.reduce((smallest, sample) => {
      const size = Number.parseFloat(sample.fontSize);
      return !smallest || size < smallest.size ? { size, text: sample.text, selector: sample.selector } : smallest;
    }, null as { size: number; text: string; selector: string } | null);
    const undersizedText = textSamples
      .filter((sample) => Number.parseFloat(sample.fontSize) < 12.8)
      .map(({ text, selector, fontSize }) => ({ text, selector, fontSize }));
    return {
      viewport: { width: innerWidth, height: innerHeight },
      document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      h1: { text: h1?.textContent?.trim() ?? "", ...styleOf(h1) },
      body: styleOf(document.body),
      firstSection: firstSection ? {
        top: Math.round(firstSection.getBoundingClientRect().top),
        bottom: Math.round(firstSection.getBoundingClientRect().bottom),
        background: getComputedStyle(firstSection).backgroundColor
      } : null,
      shellWidths,
      resumeSamples,
      smallestText,
      undersizedText,
      fonts: {
        hostGrotesk: document.fonts.check('16px "Host Grotesk Variable"'),
        usesInstrumentSerif: [...document.querySelectorAll("*")].some((element) => getComputedStyle(element).fontFamily.includes("Instrument Serif")),
        instrumentSerif: [...document.fonts].some((font) => font.family.includes("Instrument Serif") && font.status === "loaded"),
        loaded: [...document.fonts].map((font) => ({ family: font.family, status: font.status, weight: font.weight, style: font.style }))
      },
      visibleText: document.body.innerText
    };
  });
}

test("full-page visual review captures typography, fonts and full-width layout", async ({ page }) => {
  test.setTimeout(240_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const outputDirectory = path.resolve(import.meta.dirname, "../../artifacts/visual-review");
  fs.mkdirSync(outputDirectory, { recursive: true });
  const metrics: Record<string, unknown> = {};

  for (const route of routes) {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const fontRequests: string[] = [];
      const onResponse = (response: { url: () => string }) => {
        if (/\.(?:woff2?|ttf)(?:\?|$)/u.test(response.url())) fontRequests.push(response.url());
      };
      page.on("response", onResponse);
      const response = await page.goto(route.url, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      expect(response?.status(), `${route.name} ${viewport.name}`).toBe(200);
      const result = await visualMetrics(page);
      expect(result.document.width, `${route.name} ${viewport.name} horizontal overflow`).toBeLessThanOrEqual(viewport.width);
      expect(result.visibleText, `${route.name} visible MIND ONE naming`).not.toMatch(/\bMINDONE\b/u);
      expect(result.fonts.hostGrotesk, `${route.name} ${viewport.name} Host Grotesk`).toBe(true);
      if (result.fonts.usesInstrumentSerif) {
        expect(result.fonts.instrumentSerif, `${route.name} ${viewport.name} Instrument Serif`).toBe(true);
      }
      const shellGutter = viewport.name === "mobile" ? 24 : 32;
      expect(result.shellWidths[0]?.width, `${route.name} ${viewport.name} viewport-width shell`).toBeGreaterThanOrEqual(viewport.width - shellGutter);
      expect(result.shellWidths[0]?.width, `${route.name} ${viewport.name} shell within viewport`).toBeLessThanOrEqual(viewport.width);
      if (viewport.name === "laptop") {
        expect(Number.parseFloat(result.body.fontSize), `${route.name} laptop body type`).toBeGreaterThanOrEqual(17);
      }
      expect(result.smallestText?.size, `${route.name} ${viewport.name} smallest functional text: ${JSON.stringify(result.smallestText)}`).toBeGreaterThanOrEqual(12.8);
      expect(result.undersizedText, `${route.name} ${viewport.name} readable functional text`).toEqual([]);
      if (route.url.startsWith("http://127.0.0.1:4321/")) {
        expect(result.firstSection?.background, `${route.name} ${viewport.name} brighter cobalt hero`).not.toBe("rgb(9, 15, 23)");
        for (const resume of result.resumeSamples) {
          expect(resume.fontFamily, `${route.name} ${viewport.name} résumé font`).toContain("Instrument Serif");
          expect(Number.parseFloat(resume.fontSize), `${route.name} ${viewport.name} résumé size`).toBeGreaterThanOrEqual(18);
        }
      }
      const filename = `${route.name}-${viewport.name}.png`;
      await page.screenshot({ path: path.join(outputDirectory, filename), fullPage: true });
      await page.screenshot({ path: path.join(outputDirectory, `${route.name}-${viewport.name}-viewport.png`) });
      metrics[`${route.name}-${viewport.name}`] = { ...result, fontRequests, screenshot: filename };
      page.off("response", onResponse);
    }
  }

  fs.writeFileSync(path.join(outputDirectory, "metrics.json"), `${JSON.stringify(metrics, null, 2)}\n`);
});
