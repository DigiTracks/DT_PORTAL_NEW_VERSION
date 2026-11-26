# Digi Tracks next-generation public platform

Independent static-first replacement for the six public Digi Tracks origins. The project lives only in `/data/HomeWorks/digitracks-nextgen-portal`; the existing portal and production platform remain untouched and are not runtime dependencies.

**Status:** implemented and locally verified; repository publication is separate from deployment or cutover. Production delivery still requires owner-supplied infrastructure, content permissions and credentials. See [QA_REPORT.md](QA_REPORT.md) for measured evidence and [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) for the route/product inventory and operating boundaries.

## What is included

- Six independently buildable Astro shells with selective React islands.
- One typed catalogue and route registry driving navigation, metadata, schema, redirects, CTAs and tests.
- Official Digi Tracks lockups, icons and 33 unique product marks copied from the read-only reference repository with SHA-256 provenance.
- A cinematic portal home with MIND ONE as the flagship, a verified MIND ONE/MIND ONE Pro comparison, elevated Vedik and Nipuna stories, and a dedicated Procurement ecosystem.
- Purpose-built flagship, edition comparison, procurement, industry and services compositions while preserving every established offering and URL.
- Hierarchical desktop/mobile Products navigation, a six-column footer and visible “Network” terminology instead of website-facing “Estate” labels.
- Registry-derived product atlas, product detail instruments and shared enquiry journeys.
- SourceCraft search, region filters, favourites, recents, export and offline shell.
- ProcureSherpa local-first hash workspace, LearnPMO public guides and HCM Fusion approved evidence pages.
- An API-only Cloudflare Worker with D1 lead/outbox storage, Queue delivery, Resend email, signed CRM webhooks, fail-closed Turnstile handling and operator-controlled demo grants.
- Per-origin canonicals, robots, sitemaps, social cards, security headers and real static 404s; SourceCraft/LearnPMO install manifests and a SourceCraft-only service worker.
- Privacy-safe first-party CTA, demo, enquiry-start/submission and resource-export events, plus server-side lead/delivery events.
- Partitioned route/origin CSS emitted inline through the shared layout, leaving only the small common stylesheet external.

Application parity, rights-reserved editorial migration, live email/CRM delivery and production provisioning are deliberately not claimed.

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

The enquiry form remains disabled until a lead endpoint and Turnstile site key are configured. In that state it collects no details and offers a contextual `mailto:contact@digitracks.net` fallback; nothing is sent from the page. Static reading and local tools do not require the lead Worker.

### Build and preview

```bash
pnpm build
pnpm --filter './apps/*' --filter '!@digitracks/lead-api' --parallel preview
```

`pnpm build` generates deploy manifests, builds all six shells and the Worker dry-run bundle, then generates exact CSP hashes and security headers. Route/origin-specific CSS is emitted inline by the shared layout; only `base.css` remains a common external stylesheet. Normal builds use local copied assets and do not read the old repository or require ImageMagick.

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
| `PUBLIC_LEAD_ENDPOINT` | Absolute API lead endpoint used by the shared form and the base for first-party `/api/events`. The generated CSP currently permits `https://digitracks.net`; another API origin requires a deliberate CSP update and verification. |
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
pnpm verify             # preservation, types, tests, build, budgets, routes, estate, axe, e2e, form and analytics journeys
pnpm audit:routes       # 86 indexable routes across 1440/1024/768/390 states
pnpm audit:performance  # six-origin simulated mobile Lighthouse matrix
pnpm verify:estate      # route/asset/redirect/SEO/header validation
pnpm budget             # HTML, initial JS/CSS and real font-transfer budgets
pnpm test:api           # Worker validation, delivery, webhook, demo and analytics tests
pnpm test:lead-form     # shared form and CTA/form event browser journeys
pnpm test:analytics     # SourceCraft and ProcureSherpa export-event browser journeys
```

`pnpm verify` reads `/data/HomeWorks/DT-Portal-main` solely to prove that reference repository is unchanged. It is therefore machine-specific; normal development and builds are not. The performance audit is separate from `pnpm verify` and must be run explicitly.

Automated checks are evidence, not proof of WCAG conformance, field performance, inbox delivery, CRM receipt or search-engine acceptance. Lighthouse INP was not measured in the recorded runs.

Final recorded results: 2,330 route records, 384 preserved baseline mappings, 86 indexable pages, 893 redirects, 869 HTML files, 37 catalogue entries and 130 governed assets. The responsive crawl covered 86 routes and 344 viewport states with no issue groups; 40 accessibility/browser-health checks recorded zero axe violations; rebuilt Lighthouse performance scored 98–100 across all six origins. Exact values and commands are in [QA_REPORT.md](QA_REPORT.md).

## Regeneration

```bash
pnpm generate:manifests  # redirect and deployment manifests
pnpm generate:brand      # operator-only; reads the approved old assets and requires ImageMagick
node scripts/generate-registries.mjs  # operator-only catalogue/route/content registry regeneration
```

Registry regeneration reads the approved audit/reference baseline and writes generated files inside this project. Do not point runtime code at the old repository. `inventories/source-assets.json` is the current approved identity inventory; `inventories/assets.json` is the historical audit-time inventory.

## Production readiness

No deployment, DNS change, secret change, CI workflow or cutover is included. Before an approved release, the owner must:

- Provision and route the API-only Worker, D1, Queues and Analytics Engine.
- Supply and test Resend, CRM and Turnstile configuration.
- Supply real demo destinations and qualification/issuance policy.
- Supply approved MIND ONE/MIND ONE Pro marks if official product identity assets are required; the current neutral identifiers are not presented as official logos.
- Grant editorial permission for SourceCraft and HCM Fusion or keep those records noindex/inaccessible.
- Supply authorised application source/data for ProcureSherpa, LearnPMO and HCM Fusion parity.
- Approve each origin's hosting, redirects, monitoring, backups and rollback.
- Verify Search Console properties and submit sitemaps; local generation does not prove acceptance.

The supplied repository URL authorizes committing and pushing this new project after implementation and verification. It does not authorize production deployment or cutover.

## Documentation

- [ADDENDUM_GAP_ANALYSIS.md](docs/ADDENDUM_GAP_ANALYSIS.md) — final addendum delivery report, requirement closure and remaining owner blockers.
- [WEBSITE_AUDIT.md](docs/WEBSITE_AUDIT.md) — historical baseline audit of the existing estate.
- [COMPETITOR_ANALYSIS.md](docs/COMPETITOR_ANALYSIS.md) — dated competitor research and structural lessons.
- [DESIGN_STRATEGY.md](docs/DESIGN_STRATEGY.md) — implemented identity, art direction, components and motion rules.
- [INFORMATION_ARCHITECTURE.md](docs/INFORMATION_ARCHITECTURE.md) — routes, indexability, content governance and origin state.
- [SEO_STRATEGY.md](docs/SEO_STRATEGY.md) — metadata, schema, sitemap, redirect and indexing policy.
- [CONVERSION_STRATEGY.md](docs/CONVERSION_STRATEGY.md) — enquiry intents, delivery semantics, demo gating and measurement boundaries.
- [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) — architecture, full product list, route counts and owner runbook.
- [QA_REPORT.md](QA_REPORT.md) — final measured results, limitations and unresolved dependencies.
