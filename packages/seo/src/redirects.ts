import { originById, type OriginId } from "./routes.ts";

export interface RedirectRule {
  origin: OriginId;
  from: string;
  to: string;
  permanent: boolean;
}

export function validateRedirects(rules: readonly RedirectRule[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const sources = new Set(rules.map((rule) => new URL(rule.from, originById(rule.origin).origin).toString()));

  for (const rule of rules) {
    const key = `${rule.origin}:${rule.from}`;
    if (seen.has(key)) errors.push(`Duplicate redirect source: ${key}`);
    seen.add(key);
    if (!rule.from.startsWith("/")) errors.push(`Redirect source must start with /: ${key}`);
    if (!rule.permanent) errors.push(`Redirect must be permanent: ${key}`);
    const source = new URL(rule.from, originById(rule.origin).origin).toString();
    if (source === rule.to) errors.push(`Redirect loops to itself: ${key}`);
    if (sources.has(rule.to)) errors.push(`Redirect chain detected at: ${key}`);
    try {
      const target = new URL(rule.to);
      if (target.protocol !== "https:") errors.push(`Redirect target must use HTTPS: ${key}`);
      if (target.origin !== originById(rule.origin).origin) errors.push(`Redirect target must stay on its origin: ${key}`);
    } catch {
      errors.push(`Redirect target is not absolute HTTPS: ${key}`);
    }
  }

  return errors;
}
