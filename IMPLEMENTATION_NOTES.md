# Digi Tracks implementation notes

**Date:** 2026-11-26

**Project root:** `/data/HomeWorks/digitracks-nextgen-portal`

**Reference repository:** `/data/HomeWorks/DT-Portal-main` — read-only, never a runtime dependency

**Release state:** implementation and local verification complete; repository publication is separate from deployment or cutover

## 1. Architecture

```text
apps/
  portal/          Astro static shell and selective React islands
  learn/           Astro static learning hub
  sourcecraft/     Astro index, rights-aware records and local tools
  procuresherpa/   Astro shell plus local-first hash workspace
  learnpmo/        Astro public field guides and route-boundary shell
  hcmfusion/       Astro approved public evidence surfaces
  lead-api/        API-only Cloudflare Worker
packages/
  brand/           Approved asset registry and generated identity records
  ui/              Shared Astro/React components and origin styles
  catalog/         Product, solution, hub and licensing contracts
  content/         Governed content records and editorial status
  seo/             Route registry, metadata, schema, sitemap and redirects
  state/           Origin-namespaced browser storage and migrations
scripts/           Registry, manifest, header, preservation and QA tooling
tests/             Unit, state and Playwright coverage
inventories/       Audited baseline, claims, defects, assets and generated registries
artifacts/         Measured verification output
```

The six public apps emit static HTML with `build.format: "file"`. React hydrates only where interaction is real: navigation, catalogue filtering, enquiry forms, SourceCraft local tools, ProcureSherpa workspace controls and the portal sculpture. Unknown public routes return a real noindex 404 rather than an application shell.

Shared packages share code and contracts only. Cookies, localStorage, IndexedDB, authentication, service-worker cache names and runtime state are not shared across origins.

## 2. Toolchain

- Node.js 24.x and pnpm 12.16.1.
- Astro 7.4.13 with `@astrojs/react` 7.1.9.
- React/React DOM 19.3.1.
- TypeScript 6.0.3. TypeScript 7 was rejected because Astro Check does not support it.
- Tailwind CSS 4.3.5.
- Three.js 0.187.0, lazy-loaded only on eligible desktop portal homes.
- Phosphor Icons 2.1.10.
- Host Grotesk Variable and Instrument Serif, self-hosted under their OFL licences.
- Playwright 1.65.1, axe-core 4.14.1 and Lighthouse 13.6.0 for local QA.

No dependency or configuration in the old repository was changed.

## 3. Registry and URL model

One generated route registry contains 2,330 records across six origins. Records include public pages, utility/private boundaries, deterministic hash routes, aliases and redirects; they are not all emitted HTML pages.

| Origin | Canonical base | Registry records | Baseline sitemap mappings | Indexable records | Redirect records |
|---|---|---:|---:|---:|---:|
| Portal | `https://digitracks.net` | 129 | 58 | 59 | 64 |
| Learn | `https://learn.digitracks.net` | 15 | 6 | 6 | 7 |
| SourceCraft | `https://sourcecraft.digitracks.net` | 293 | 139 | 5 | 146 |
| ProcureSherpa | `https://procuresherpa.digitracks.net` | 545 | 1 | 1 | 2 |
| LearnPMO | `https://learnpmo.digitracks.net` | 75 | 12 | 12 | 38 |
| HCM Fusion | `https://hcmfusion.digitracks.net` | 1,273 | 168 | 3 | 636 |
| **Total** |  | **2,330** | **384** | **86** | **893** |

The estate verifier reports 869 HTML files: 86 indexable pages, 782 noindex pages and one redirect document. The difference between preserved baseline mappings and current indexable records is intentional: rights-reserved, blocked, retired or unapproved content is not promoted into search simply because its URL existed before.

Each origin owns one trailing-slash policy, sitemap, robots declaration, canonical host and 404. SourceCraft and LearnPMO have install manifests; only SourceCraft registers a service worker. Redirects are permanent, same-origin and one-hop. ProcureSherpa hash routes remain non-indexable. Stats is outside the replacement scope and remains non-indexable/unavailable in the baseline evidence.

Verification was performed before the first content commit, so the recorded sitemaps omit `lastmod` rather than inventing a build-date freshness claim. A post-publication build must use full git history to derive defensible dates. Search Console verification and sitemap submission remain owner actions.

## 4. Product inventory

The catalogue contains 37 records: 35 source-defined products plus two request-only MIND ONE edition routes. The public wording is **“35 source-defined products + two request-only MIND ONE edition routes.”** It does not describe all 37 entries as generally available products.

| ID | Name | Route | Registered availability |
|---|---|---|---|
| vedik | Vedik | `/products/vedik` | available |
| chronos | Chronos | `/products/chronos` | available |
| glowra | Glowra | `/products/glowra` | available |
| nipuna | Nipuna | `/products/nipuna` | available |
| vertex | Vertex | `/products/vertex` | available |
| unify | Unify | `/products/unify` | available |
| orion | Orion | `/products/orion` | available |
| orion-hunter | Orion Hunter | `/products/orion-hunter` | available |
| construction | Construction Management | `/products/construction-management` | available |
| transportation | Transportation Management | `/products/transportation-management` | available |
| sherpa | Procure Sherpa | `/products/sherpa-toolkit` | available |
| quote-simulator | Quote Simulator | `/products/quote-simulator` | available |
| opspilot | OpsPilot | `/products/opspilot` | available |
| recon | Recon | `/products/recon` | available |
| vantor | Vantor | `/products/vantor` | available |
| campus-grid | Campus Grid | `/products/campus-grid` | available |
| procure5 | Procure5 | `/products/procure5` | available |
| nexora | Nexora | `/products/unify/nexora` | available |
| arventa | Arventa | `/products/unify/arventa` | available |
| monexa | Monexa | `/products/unify/monexa` | available |
| planora | Planora | `/products/unify/planora` | available |
| logistra | Logistra | `/products/unify/logistra` | available |
| procura | Procura | `/products/unify/procura` | available |
| orbitra | Orbitra | `/products/unify/orbitra` | available |
| workzen | Workzen | `/products/unify/workzen` | available |
| connexa | Connexa | `/products/unify/connexa` | available |
| vedik-school-erp | Vedik School Management ERP | `/products/vedik/school-erp` | available |
| vedik-social | Vedik Social Community | `/products/vedik/social-community` | available |
| unnati | Unnati | `/products/vedik/unnati` | available |
| vedik-university | Vedik University Management | `/products/vedik/university` | available |
| procureleak | ProcureLeak | `/products/procure5/procureleak` | available |
| tenderguard | TenderGuard | `/products/procure5/tenderguard` | available |
| contractleak | ContractLeak | `/products/procure5/contractleak` | available |
| procuredecision | ProcureDecision | `/products/procure5/procuredecision` | available |
| procureoutcomes | ProcureOutcomes | `/products/procure5/procureoutcomes` | available |
| mindone | MIND ONE | `/products/mindone` | request-only / pre-launch |
| mindone-pro | MIND ONE Pro | `/products/mindone-pro` | request-only / planned complete edition |

Pipeline-only concepts are excluded from public products, forms, navigation, schema and sitemaps. Free-to-use and open-source remain separate licence concepts.

## 5. Identity and asset provenance

The approved source set contains 40 owner-supplied assets:

- Seven master identity/icon assets.
- Thirty-three unique official WebP product marks.

Two size-matched 320px lockup derivatives bring the current approved identity inventory to 42 records and 87 copied files across six origins. Derivatives are recorded with their ImageMagick operation and source SHA-256; originals in the reference repository are unchanged. The official ICO is the favicon. Official 192px and 512px icons are used by the install manifests.

Some products intentionally reuse a family mark. MIND ONE and MIND ONE Pro have no supplied official marks and retain neutral generated identifiers that are never described as official logos. `inventories/source-assets.json` is the current identity inventory. `inventories/assets.json` is historical audit-time evidence and is not the current approval list.

`pnpm generate:brand` is operator-only. It reads the approved old assets, verifies hashes and requires ImageMagick. Normal builds use local copies and need neither the old repository nor ImageMagick.

## 6. Visual and motion implementation

The portal uses a dark cinematic ground, warm editorial reading surfaces, Host Grotesk, restrained Instrument Serif emphasis and one cyan signal colour. The rejected paper-only pass and radial orbital web are not present.

The homepage sculpture is **DT—01 / Systems Engine / Exploded Architecture**: five stacked machined layers, a hexagonal core, vertical conduits, support rails, ports, fasteners and status modules. It performs one 1.2-second assembly and a 72-second turntable at a 30fps cap. It hydrates only on desktop/fine-pointer/no-reduced-motion sessions, pauses when hidden or offscreen, handles context loss and disposes all geometries, materials, listeners, observers and the renderer on unmount. Mobile and reduced-motion sessions retain a static isometric SVG and do not initialize WebGL.

Product pages use catalogue-derived capability and architecture instruments. They are not fabricated application screenshots. Long product names wrap; long unbroken names receive a compact display treatment. Capability icons are selected semantically from the capability text rather than by list position.

The addendum adds purpose-built compositions rather than duplicating the generic product template:

- MIND ONE and MIND ONE Pro use a dedicated flagship narrative, practice-sequence instrument and product-bound request path.
- `/products/mindone/compare/` compares only published positions and explicitly unresolved entitlements.
- `/procurement-software/` explains the Vertex, Vantor, Procure5, Procure Sherpa and ProcureSherpa Learning relationships without implying unverified integration.
- Six solution pages now contain industry-specific challenges, workflows, product applicability, qualitative outcomes and CTAs.
- `/services/` separates evaluation, implementation, migration and support from the product catalogue.
- Construction and Transportation remain complete catalogue records but no longer lead the homepage hierarchy.

The shared shell is `min(100% - 3rem, 112rem)`; readable prose keeps separate measures. The final MIND ONE pass uses the body face at `0.82rem` for supporting labels, a 110.592px H1 at 1536px and a measured 1,488px shell with 24px side insets. Visible naming is **MIND ONE**, never `MINDONE`; lowercase IDs and URLs remain stable.

### Stylesheet architecture

`base.css` contains shared shell and design-system rules. Portal CSS is partitioned into common, home, flagship, procurement, industry, services, catalogue, product and contact families; child-origin CSS is partitioned by origin. `SiteLayout.astro` emits the applicable route/origin CSS inline, leaving only the small cacheable common stylesheet external. Exact shared-rule duplicates were removed. This corrected the previous render-blocking, high-unused-CSS regression and is covered by the final six-origin Lighthouse matrix.

## 7. Origin behavior and state boundaries

### SourceCraft

- Search, region filter, favourites, recents, export, clear and undo.
- SourceCraft-only versioned storage namespace and corrupt-state handling.
- Working saved-route entry point and offline shell.
- Editorial status is visible. Rights-reserved definitions are not published, and term routes remain noindex/in-review.
- Regional packs remain blocked except the regional index.

### ProcureSherpa

- Local-first hash-route manifest, route search, local review notes and unknown-hash state.
- Deterministic detail routes are preserved but not independently indexable.
- No authenticated/application-parity claim without authorised source, schemas and data.

### LearnPMO

- Twelve independently authored public guides.
- Explicit route manifest and real 404 behavior for unknown/private surfaces.
- Workspace/account/backup/cloud-sync parity is blocked pending authorised application source and rules.

### HCM Fusion

- Three independently authored indexable public evidence surfaces.
- Stable identifiers are retained in governed records.
- Lessons, concepts, glossary, assessments, certification papers, SOPs, scenarios, exports, progress, roles and tenant behavior remain blocked/noindex until permission and application rules are supplied.

No local tool implies server synchronisation. No assessment answer, score, progress record or customer data is fabricated.

## 8. Enquiry and delivery flow

The shared form carries a validated intent and catalogue product ID from route/query context. Supported intents are `product-enquiry`, `demo`, `consultation`, `migration`, `support`, `partnership` and `learning`. MIND ONE and MIND ONE Pro use `product-enquiry` because access is request-only; ProcureSherpa Learning uses `learning` with the `sherpa` product ID; Services routes select `consultation`, `migration` or `support` by engagement.

If the endpoint or Turnstile site key is absent, the form collects no details and offers a contextual `mailto:contact@digitracks.net` fallback containing only the selected intent/product and a safe prompt. Nothing is sent from the page.

Submission order:

1. Method and exact allowed origin.
2. Approximate per-isolate abuse limit.
3. Declared and streamed body limit of 20,000 bytes.
4. JSON/schema and field validation.
5. Honeypot and server-verified Turnstile.
6. D1 transaction creating the lead, idempotency record and channel outbox rows.
7. HTTP 202 `received` only after durable storage.
8. Queue delivery for Resend and the signed CRM webhook.
9. Cron/consumer repair for transient or pending work.

The response explicitly says email and CRM delivery are asynchronous and not yet confirmed. Delivery states remain distinct: `email_accepted`, `webhook_acknowledged`, `failed` and `dead_letter`. Provider acceptance is not described as inbox or CRM receipt.

The CRM contract uses HTTPS, HMAC-SHA-256 over timestamp plus raw body, a stable delivery ID, event version, replay window, configurable field mapping and bounded retries. The receiver must deduplicate by delivery ID. Resend uses a stable 24-hour idempotency key.

No arbitrary recipient or redirect is accepted from the client. No names, emails, organisations, messages, tokens, credentials or free-text form content are emitted to analytics or logs.

When `PUBLIC_LEAD_ENDPOINT` is configured, the browser bridge sends only allowlisted `cta_click`, `demo_open`, `lead_start`, `lead_submit` and `resource_export` events to `/api/events`. Payloads contain only event, intent, catalogue product ID, CTA ID and resource ID; they exclude URLs, form text, cookies, local storage, correlation IDs and personal data. The endpoint enforces exact origin, a 2,000-byte cap and an approximate minimum 60-request/minute limit without D1, Queue or Turnstile. Missing or failing Analytics Engine returns `204`, transport errors are caught, and an absent endpoint sends no events.

API-side Analytics Engine events still record server-observed lead/delivery/demo transitions with a hashed correlation ID. Browser payloads use fixed six-blob dimensions and never carry that correlation ID. Production event volumes, consent/retention approval and dashboard access remain `UNKNOWN` until configured and evidenced.

## 9. Demo access

Public full-play URLs are removed. The journey requests access and offers an email fallback; it never says access was issued when only an enquiry was received.

Operator endpoints issue, redeem and revoke signed grants. Tokens are unique, hashed at rest, expiring, revocable and single-use. Destination URLs come only from server-side `DEMO_DESTINATIONS_JSON`; the client cannot supply an arbitrary redirect.

Real product destinations and the qualification policy were not supplied, so production issuance remains blocked rather than simulated.

## 10. API and data model

Worker endpoints:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/lead` | POST | Validate and durably receive an enquiry. |
| `/api/events` | POST | Accept privacy-safe allowlisted browser milestones without durable dependencies. |
| `/api/lead/health` | GET | Report D1/Queue/Turnstile readiness with redacted configuration. |
| `/api/demo/issue` | POST | Operator-only grant issuance. |
| `/api/demo/redeem` | GET | Validate and consume a grant. |
| `/api/demo/grants/:id/revoke` | POST | Operator-only revocation. |

D1 tables: `leads`, `idempotency_keys`, `outbox`, `delivery_attempts` and `demo_grants`. Queue processing uses leases, bounded attempts, retry scheduling, permanent-failure classification and dead-letter state.

`/api/lead/health` does not test Resend, the CRM receiver or demo destinations. Legacy portal `/api/lead` and `/api/send-email` redirect records are not evidence of same-host API routing; production must route the approved API origin explicitly.

## 11. Production provisioning and release runbook

No CI workflow, Pages project manifest, deploy script, DNS change or production secret change is included. `apps/lead-api/wrangler.jsonc` still contains `REPLACE_WITH_D1_DATABASE_ID`.

Before an owner-approved release:

1. Create/confirm the Cloudflare account resources: D1 database, delivery Queue, dead-letter Queue, Analytics Engine dataset and API-only Worker.
2. Replace the D1 placeholder, apply the migration and configure bindings.
3. Set public `PUBLIC_LEAD_ENDPOINT` and coherent Turnstile keys before building each shell.
4. Store Worker secrets in Cloudflare; configure verified From/Reply-To/destination addresses and the CRM staging contract.
5. Route only `/api/*` to the Worker. Keep public page traffic asset-first and preserve real 404s.
6. Build with full git history if sitemap dates are required; never substitute the build date for every URL.
7. Verify every origin's canonical, robots, sitemap, redirects, social cards and security headers, plus the SourceCraft/LearnPMO manifests and SourceCraft-only service-worker scope where implemented.
8. Run staging lead tests through real inbox/CRM receivers, including duplicates, bad signatures, replay, timeout, retries and dead letters.
9. Approve DNS/cutover per origin, monitoring, alert ownership, backups and retention.
10. Submit/verify Search Console properties and sitemaps; record actual acceptance.

Rollback is a separately approved static-asset/Worker version rollback plus DNS/routing restoration where applicable. D1 migrations and queued deliveries require a data-aware rollback plan; do not treat a Worker rollback as a database rollback.

## 12. Evidence and limitations

Final measured results are in [QA_REPORT.md](QA_REPORT.md). Core artifacts:

- `artifacts/preservation-verification.json`
- `artifacts/estate-verification.json`
- `artifacts/budgets.json`
- `artifacts/browser-audit.json`
- `artifacts/lighthouse-*.json`
- `artifacts/security-headers.json`
- `inventories/routes.json`
- `inventories/source-assets.json`
- `inventories/generated-registry-summary.json`

Final local evidence covers 2,330 route records, 869 HTML files, 86 indexable pages, 893 redirects, 37 catalogue entries and 130 governed assets. The 86-route/344-state responsive crawl found no broken links, fragment failures, CSS failures, overflow or console/page errors. Forty accessibility/browser-health checks recorded zero axe violations. Rebuilt Lighthouse performance scored 98–100 across the six origins; LCP ranged from 916.5ms to 2,013.7ms and CLS from 0 to 0.001346.

Automated checks do not prove WCAG conformance, field Core Web Vitals, live delivery or search-engine acceptance. Lighthouse INP was not measured. Production credentials, real application parity, editorial permission, official MIND ONE marks, business proof and external dashboards remain explicit owner dependencies.
