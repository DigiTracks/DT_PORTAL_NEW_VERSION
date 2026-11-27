import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ANALYTICS_CTA_IDS, ANALYTICS_INTENTS } from "../../packages/catalog/src/analytics";
import { buildBrowserEvent } from "../../packages/ui/src/lib/analytics";

const roots = ["packages/ui/src", "apps"];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".astro") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(astro|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const ctaIds = new Set<string>(ANALYTICS_CTA_IDS);
const declared = roots.flatMap((root) => walk(root)).flatMap((file) =>
  [...readFileSync(file, "utf8").matchAll(/\b(?:ctaId|data-cta)="([a-z0-9-]+)"/g)].map((match) => `${match[1]} (${file})`),
);

describe("analytics allows every CTA the UI emits", () => {
  it("declares every literal ctaId used by a component", () => {
    const missing = declared.filter((entry) => !ctaIds.has(entry.split(" ")[0]));
    expect(missing).toEqual([]);
  });

  it("emits an event for each declared CTA id", () => {
    for (const id of ctaIds) {
      expect(buildBrowserEvent("cta_click", { ctaId: id })).toEqual({ event: "cta_click", ctaId: id });
    }
  });
});

function intentsIn(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const block = source.slice(source.indexOf("LEAD_INTENTS = ["), source.indexOf("] as const;", source.indexOf("LEAD_INTENTS = [")));
  return [...block.matchAll(/"([a-z-]+)"/g)].map((match) => match[1]);
}

describe("lead intents stay in step across the stack", () => {
  it("matches the shared analytics list", () => {
    expect(intentsIn("packages/ui/src/components/LeadForm.tsx")).toEqual([...ANALYTICS_INTENTS]);
    expect(intentsIn("apps/lead-api/src/validation.ts")).toEqual([...ANALYTICS_INTENTS]);
  });
});
