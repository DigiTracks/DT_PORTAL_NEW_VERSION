# Digi Tracks next-generation public platform

Independent static-first replacement for the six public Digi Tracks origins. The project lives only in `/data/HomeWorks/digitracks-nextgen-portal`; the existing portal and production platform remain untouched and are not runtime dependencies.

**Status:** implemented and verified locally on 27 November 2026; current measured results are recorded in [QA_REPORT.md](QA_REPORT.md). Repository publication is separate from deployment or cutover, and production delivery still requires owner-supplied infrastructure, content permissions and credentials. See [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) for the current route/product inventory and operating boundaries.

## What is included

- Six independently buildable Astro shells with selective React islands.
- One typed catalogue and route registry driving navigation, metadata, schema, redirects, CTAs and tests.
- Official Digi Tracks lockups, icons and 33 unique product marks copied from the read-only reference repository with SHA-256 provenance.
- A product-led portal home with one unified MIND ONE family block, a registry-driven three-tier orbit containing all 37 catalogue entries at regular angular intervals within each tier, and a static featured product-deck fallback that does not itself contain all 37 products.
- Elevated Vedik and Nipuna stories and a dedicated Procurement ecosystem.
- Purpose-built flagship, edition comparison, procurement, industry and services compositions while preserving every established offering and URL.
- Hierarchical desktop/mobile Products navigation, a four-column footer and visible “Network” terminology instead of website-facing “Estate” labels.
- MIND ONE Basic and MIND ONE Complete, both request-only and pre-launch. Their internal IDs and URLs remain `mindone` and `mindone-pro`, including `/products/mindone-pro/`.
- One shared demo-eligibility rule across catalogue CTAs, contact-form URL/manual state, client validation, Worker validation and operator issuance: only public, requestable products marked `available` can enter `demo`. Other products use an evaluation or product-enquiry path.
- Registry-derived product atlas, product detail instruments and shared enquiry journeys.
- SourceCraft search, region filters, favourites, recents, export and offline shell.
- ProcureSherpa local-first hash workspace, LearnPMO public guides and HCM Fusion approved evidence pages.
- An API-only Cloudflare Worker with D1 lead/outbox storage, Queue delivery, Resend email, signed CRM webhooks, fail-closed Turnstile handling and operator-controlled demo grants.
- Distinct visual systems for all six origins, with origin-aware header, footer, closing-section colors and lockup contrast.
- Per-origin canonicals, robots, sitemaps, origin-aware social cards, security headers and real static 404s; origin-aware SourceCraft/LearnPMO install manifests and a SourceCraft-only service worker.
- Privacy-safe first-party CTA, demo, enquiry-start/submission and resource-export events, plus server-side lead/delivery events.
- Partitioned route/origin CSS emitted inline through the shared layout, with shared layout/component CSS kept external.

Application parity, rights-reserved editorial migration, live email/CRM delivery and production provisioning are deliberately not claimed.

## Current generated baseline

`inventories/generated-registry-summary.json` records the following as generated on 2026-11-26:

| Measure | Count |
|---|---:|
| Catalogue entries | 37 |
| Source products | 27 |
| Source flagships | 13 |
| Request-only routes | 10 |
| Pre-launch routes | 2 |
| Nested products | 20 |
| Route records | 2,330 |
| Baseline sitemap mappings | 384 |
| Indexable pages | 86 |
| Governed content records | 1,246 |

These measures are intentionally different. Route records include utility/private boundaries, aliases, redirects and hash routes; they are not emitted pages. The 1,246 governed content records are distinct from the 130 governed asset records in the social-card inventory. `available` is a registry availability label, not independent proof of production readiness or commercial entitlement.

## Product and portfolio boundaries

- **MIND ONE Basic** (`mindone`) is the focused free-access-by-request position. **MIND ONE Complete** (`mindone-pro`) has reviewed implementation for durable local profiles/sessions, saved practice history, résumé/JD comparison, learning goals, progress tracking, role-development maps, source-attributed remote opportunity listings, app lock and diagnostics. Final commercial terms, quotas, provider terms, billing, integrations, production deployment and release timing remain `UNKNOWN` for both editions.
- **UNIFY** was rejected as the Complete-edition name because it collides with **Unify**, the separate nine-app ERP. The catalogue keeps the stable `mindone-pro` ID and URL.
- **Vedik** is an education ecosystem containing Vedik School, Unnati College, Vedik University, Vedik Social Community and Campus Grid. Campus Grid does not replace Vertex. Shared identity, SSO, deployment, schema or integration across the ecosystem has not been verified.
- **Orion, Orion Hunter, Recon and OpsPilot** are four distinct prime developer/security products. Orion Hunter is not an Orion edition, and no shared runtime or verified integration is implied.
- No official marks were supplied for MIND ONE Basic or MIND ONE Complete. Neutral catalogue identifiers are not presented as official logos.

## Prerequisites

- Node.js 24.x.
- pnpm 12.16.1.
- A Chromium executable for the browser audits (`/usr/bin/google-chrome`, `/usr/bin/chromium` or `/usr/bin/chromium-browser`).
- Cloudflare Wrangler credentials and resources only when running or deploying the lead Worker.

The checked-in lockfile is authoritative. Do not upgrade the toolchain to silence a warning.

```bash
corepack enable
corepack prepare pnpm@12.16.1 --activate
pnpm install --frozen-lockfile
```

## Run locally

### Portal only

```bash
pnpm dev
```

Open `http://127.0.0.1:4321/`.

### All six public shells

```bash
pnpm --filter './apps/*' --filter '!@digitracks/lead-api' --parallel dev
```

| Origin | Local URL |
|---|---|
| Portal | `http://127.0.0.1:4321/` |
| Learn | `http://127.0.0.1:4322/` |
| SourceCraft | `http://127.0.0.1:4323/` |
| ProcureSherpa | `http://127.0.0.1:4324/` |
| LearnPMO | `http://127.0.0.1:4325/` |
| HCM Fusion | `http://127.0.0.1:4326/` |

Local navigation is loopback-only: links to the six published Digi Tracks origins are rewritten in the browser to the matching `127.0.0.1` preview while preserving path, query and fragment. The guard recognizes `localhost`, the full `127.0.0.0/8` range, `::1` and IPv4-mapped loopback IPv6; it also rewrites HTTP and protocol-relative production links. Path, query and hash are assigned onto a loopback URL rather than reparsed as a relative URL, so a double-slash pathname cannot replace the local authority. Published HTML keeps its production canonicals and cross-origin links; the rewrite applies only when the page itself is opened on loopback.

The enquiry form remains disabled until a lead endpoint and Turnstile site key are configured. In that state it collects no details and offers a contextual `mailto:contact@digitracks.net` fallback; nothing is sent from the page. A loopback page (`localhost`, `127.0.0.0/8`, `::1` or IPv4-mapped loopback IPv6) also refuses a configured non-loopback endpoint: it renders an explicit local-delivery-blocked state, loads no bot-verification script and sends no production request. Published pages accept only non-loopback HTTPS endpoints. Malformed, credentialed and non-HTTP endpoints fail closed. Static reading and local tools do not require the lead Worker.

### Build and preview

```bash
pnpm build
pnpm --filter './apps/*' --filter '!@digitracks/lead-api' --parallel preview
```

`pnpm build` generates deploy manifests, builds all six shells and the Worker dry-run bundle, then generates exact CSP hashes and security headers. Route/origin-specific CSS is emitted inline by the shared layout; shared layout/component CSS remains external. Normal builds use local copied assets and do not read the old repository or require ImageMagick.

### Lead Worker

Production provisioning is blocked until the placeholder D1 ID in `apps/lead-api/wrangler.jsonc` is replaced and the Queue, dead-letter Queue and Analytics Engine dataset exist. For local development:

1. Configure the D1 binding and apply `apps/lead-api/migrations/0001_lead_delivery.sql` with Wrangler's local D1 migration command.
2. Put runtime secrets in gitignored `apps/lead-api/.dev.vars`; never commit them.
3. Allow the local static origins through `ALLOWED_LOCAL_ORIGINS`.
4. Start the Worker on port 8788 with `pnpm --filter @digitracks/lead-api dev`.
5. Set `PUBLIC_LEAD_ENDPOINT=http://127.0.0.1:8788/api/lead` and `PUBLIC_TURNSTILE_SITE_KEY` before starting or rebuilding the public shells.

A successful `/api/lead/health` response proves D1, Queue and Turnstile readiness only. It does not prove Resend inbox delivery, CRM acknowledgement or demo destination readiness.

## Configuration

Public build-time variables:

| Variable | Purpose |
|---|---|
| `PUBLIC_LEAD_ENDPOINT` | Absolute API lead endpoint used by the shared form and the base for first-party `/api/events`. Loopback pages accept loopback endpoints only; published pages accept non-loopback HTTPS endpoints only. Invalid, credentialed or policy-incompatible endpoints disable delivery and analytics. The generated CSP currently permits `https://digitracks.net`; another API origin requires a deliberate CSP update and verification. |
| `PUBLIC_TURNSTILE_SITE_KEY` | Public Turnstile widget key. It must have a coherent server-side secret/site-key pair. |

Worker runtime variables and secrets:

| Group | Variables |
|---|---|
| Origins and abuse controls | `ALLOWED_LOCAL_ORIGINS`, `RATE_LIMIT_PER_MINUTE`, `RATE_LIMIT_WINDOW_SECONDS` |
| Turnstile | `TURNSTILE_SECRET`, `TURNSTILE_SITE_KEY`, `TURNSTILE_EXPECTED_ACTION`, `TURNSTILE_EXPECTED_HOSTNAMES` |
| Email | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `LEAD_NOTIFICATION_TO`, `LEAD_REPLY_TO_EMAIL`, `EMAIL_TIMEOUT_MS`, `EMAIL_MAX_ATTEMPTS` |
| CRM webhook | `CRM_WEBHOOK_URL`, `CRM_WEBHOOK_SECRET`, `CRM_WEBHOOK_PREVIOUS_SECRET`, `CRM_FIELD_MAPPING_JSON`, `WEBHOOK_TIMEOUT_MS`, `WEBHOOK_REPLAY_WINDOW_SECONDS`, `WEBHOOK_MAX_ATTEMPTS` |
| Demo grants | `ADMIN_TOKEN`, `DEMO_GRANT_SECRET`, `DEMO_GRANT_PREVIOUS_SECRET`, `DEMO_DESTINATIONS_JSON`, `DEMO_GRANT_TTL_HOURS` |

Secrets and signing/admin tokens belong in Cloudflare secret storage or gitignored local files. Missing or incoherent Turnstile configuration fails closed. Client requests cannot choose a recipient or arbitrary demo redirect.

## Verification

```bash
pnpm verify             # preservation, types, tests, build, budgets, route crawl, estate validation, axe, e2e, form and analytics journeys
pnpm audit:performance  # six-origin simulated mobile Lighthouse matrix
pnpm verify:estate      # route/asset/redirect/SEO/header validation
pnpm budget             # HTML, initial JS/CSS and real font-transfer budgets
pnpm test:api           # Worker validation, delivery, webhook, demo and analytics tests
pnpm test:lead-form     # shared form and CTA/form event browser journeys
pnpm test:analytics     # SourceCraft and ProcureSherpa export-event browser journeys
```

`pnpm verify` reads `/data/HomeWorks/DT-Portal-main` solely to prove that reference repository is unchanged. It is therefore machine-specific; normal development and builds are not. The performance audit is separate from `pnpm verify` and must be run explicitly.

The local audit server intentionally serves uncompressed responses. Budget gzip figures are offline gzip-level-9 measurements, not confirmed deployment compression; production response compression remains unconfigured and unverified. Automated checks are evidence, not proof of WCAG conformance, field Core Web Vitals, measured INP, production behavior, customer outcomes, commercial entitlement, inbox delivery, CRM receipt or search-engine acceptance.

Current local verification passed on 27 November 2026: 2,330 route records, 384 preserved baseline mappings, 86 indexable pages, 893 redirects, 869 HTML files, 37 catalogue entries and 130 governed assets. The responsive crawl covered 86 routes and 344 viewport states with no issue groups; 40 accessibility/browser-health checks recorded zero axe violations; the general browser suite passed 39/39; configured lead delivery passed 19 tests plus the separate production-endpoint refusal guard; analytics passed 2/2. The final Lighthouse matrix scored 98–100 across all six origins, with LCP from 1,004.8ms to 2,026.7ms and CLS from 0 to 0.004510; INP remains unmeasured. Exact values, commands and limitations are in [QA_REPORT.md](QA_REPORT.md).

## Regeneration

```bash
pnpm generate:manifests  # generated redirect manifests
pnpm generate:brand      # operator-only; reads the approved old assets and requires ImageMagick
node scripts/generate-registries.mjs  # operator-only catalogue/route/content registry regeneration
```

Registry regeneration reads the approved audit/reference baseline and writes generated files inside this project. Do not point runtime code at the old repository. `inventories/source-assets.json` is the current approved identity inventory; `inventories/assets.json` is the historical audit-time inventory.

## Production readiness

No deployment, DNS change, secret change, CI workflow or cutover is included. Before an approved release, the owner must:

- Provision and route the API-only Worker, D1, Queues and Analytics Engine.
- Supply and test Resend, CRM and Turnstile configuration.
- Supply real demo destinations and qualification/issuance policy.
- Resolve MIND ONE Basic/Complete commercial entitlement, quotas, provider terms, billing, deployment and launch policy; implemented scope is not released entitlement.
- Supply approved MIND ONE Basic/MIND ONE Complete marks if official product identity assets are required; the current neutral identifiers are not presented as official logos.
- Grant editorial permission for SourceCraft and HCM Fusion or keep those records noindex/inaccessible.
- Supply authorised application source/data for ProcureSherpa, LearnPMO and HCM Fusion parity.
- Approve each origin's hosting, redirects, monitoring, backups and rollback.
- Verify Search Console properties and submit sitemaps; local generation does not prove acceptance.

Repository publication, when separately authorized, does not authorize production deployment or cutover.

## Documentation

- [ADDENDUM_GAP_ANALYSIS.md](docs/ADDENDUM_GAP_ANALYSIS.md) — current addendum closure, portfolio boundaries and remaining owner blockers.
- [WEBSITE_AUDIT.md](docs/WEBSITE_AUDIT.md) — historical baseline audit of the existing estate.
- [COMPETITOR_ANALYSIS.md](docs/COMPETITOR_ANALYSIS.md) — dated competitor research and structural lessons.
- [DESIGN_STRATEGY.md](docs/DESIGN_STRATEGY.md) — current identity, six-origin art direction, orbit, components and motion rules.
- [INFORMATION_ARCHITECTURE.md](docs/INFORMATION_ARCHITECTURE.md) — routes, indexability, content governance and origin state.
- [SEO_STRATEGY.md](docs/SEO_STRATEGY.md) — metadata, schema, sitemap, redirect and indexing policy.
- [PRODUCT_INTELLIGENCE.md](docs/PRODUCT_INTELLIGENCE.md) — dated public research, later authorized review and product evidence boundaries.
- [CONVERSION_STRATEGY.md](docs/CONVERSION_STRATEGY.md) — enquiry intents, delivery semantics, demo gating and measurement boundaries.
- [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) — architecture, current product list, route counts and owner runbook.
- [QA_REPORT.md](QA_REPORT.md) — current measured local results, limitations and unresolved owner dependencies.
