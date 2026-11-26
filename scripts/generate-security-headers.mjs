import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { origins } from "../packages/seo/src/routes.ts";

const root = path.resolve(import.meta.dirname, "..");

function htmlFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

function inlineScriptHashes(files) {
  const hashes = new Set();
  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    for (const match of html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
      if (!match[1].trim()) continue;
      hashes.add(`'sha256-${crypto.createHash("sha256").update(match[1]).digest("base64")}'`);
    }
  }
  return [...hashes].sort();
}

const report = [];
for (const origin of origins) {
  const dist = path.join(root, "apps", origin.id, "dist");
  const files = htmlFiles(dist);
  if (files.length === 0) throw new Error(`No built HTML found for ${origin.id}`);
  const hashes = inlineScriptHashes(files);
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `img-src 'self' data:`,
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' ${hashes.join(" ")} https://challenges.cloudflare.com`.replace(/\s+/g, " "),
    "connect-src 'self' https://digitracks.net https://challenges.cloudflare.com",
    "frame-src https://challenges.cloudflare.com",
    "worker-src 'self'",
    "manifest-src 'self'",
    "media-src 'self'",
    "upgrade-insecure-requests"
  ].join("; ");
  const headers = [
    "/*",
    "  X-Content-Type-Options: nosniff",
    "  Referrer-Policy: strict-origin-when-cross-origin",
    "  X-Frame-Options: DENY",
    "  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "  Cross-Origin-Opener-Policy: same-origin",
    "  Cross-Origin-Resource-Policy: same-origin",
    "  Strict-Transport-Security: max-age=31536000",
    `  Content-Security-Policy: ${csp}`,
    "",
    "/_astro/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    "/social/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "  Cross-Origin-Resource-Policy: cross-origin",
    "",
    "/sw.js",
    "  Cache-Control: no-cache",
    ""
  ].join("\n");
  fs.writeFileSync(path.join(dist, "_headers"), headers);
  report.push({ origin: origin.id, htmlFiles: files.length, inlineScriptHashes: hashes.length, cspBytes: Buffer.byteLength(csp) });
}

fs.mkdirSync(path.join(root, "artifacts"), { recursive: true });
fs.writeFileSync(path.join(root, "artifacts/security-headers.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), origins: report }, null, 2)}\n`);
console.log(`Security headers generated for ${report.length} origins using exact inline-script hashes.`);
