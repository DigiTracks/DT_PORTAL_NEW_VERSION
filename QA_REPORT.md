# Digi Tracks next-generation estate — QA report

**Report date:** 26 November 2026

**Measured evidence date:** 26 November 2026 local run; artifact timestamps are preserved as recorded

**Project root:** `/data/HomeWorks/digitracks-nextgen-portal`

**Reference repository:** `/data/HomeWorks/DT-Portal-main`

**Release state:** local implementation and verification only; no deployment, DNS change, secret change or cutover

## 1. Executive result

The replacement implements the complete six-origin public shell, the addendum portfolio hierarchy, official Digi Tracks identity, flagship/product/industry/service experiences, local-only child-site tools, durable lead acceptance, signed CRM delivery, qualified demo grants and privacy-safe first-party analytics.

Final local evidence is green for typechecking, 123 unit/API tests, production builds, byte budgets, estate validation, a clean 86-route/344-state responsive crawl, 40 accessibility/browser-health checks, 25 estate Playwright regressions, 15 enquiry-form journeys and two analytics journeys. The rebuilt six-origin Lighthouse matrix scores 98–100 for performance.

These results establish local implementation quality. They do **not** prove production delivery, WCAG conformance, field Core Web Vitals, Lighthouse INP, search-engine acceptance, inbox/CRM receipt or application parity.

Production release remains blocked by owner-supplied infrastructure, credentials, editorial permission, application source/data, demo destinations and privacy/retention approval. The old production estate was not changed.

## 2. Scope and preservation

| Item | Result |
|---|---|
| Public origins | Portal, Learn, SourceCraft, ProcureSherpa, LearnPMO and HCM Fusion |
| Baseline sitemap mappings audited | 384 |
| Historical route inventory | 1,443 records |
| Generated replacement route registry | 2,330 records, including aliases, redirects, utility/private boundaries and hash routes |
| Built HTML files | 869 |
| Indexable pages | 86 |
| Noindex pages | 782 |
| Redirect documents | 1 |
| Redirect records | 893 |
| Catalogue | 35 source-defined products + two request-only MIND ONE edition routes = 37 entries |
| Approved identity inventory | 40 supplied assets + two documented derivatives = 42 identity records |
| Governed asset registry | 130 records: 42 identity, 86 social cards and two font records |
| Reference HEAD | `9a4a9af84a0447926aa96f1cc4b2210232f44ffb` |
| Reference tracked files | 297/297 SHA-256 hashes matched; Git working tree clean |

Evidence: `inventories/routes.json`, `inventories/generated-registry-summary.json`, `inventories/source-assets.json`, `inventories/old-repo-tracked-hashes.json`, `artifacts/preservation-verification.json` and `artifacts/estate-verification.json`.

**Preservation caveat:** an early command mistakenly invoked pnpm from the reference working directory. It created an untracked lockfile, which was removed, and reported synchronizing ignored dependencies. The tracked Git tree and all 297 tracked-file hashes are proven unchanged. Whole-directory byte preservation, including pre-existing ignored `node_modules`, is not proven; no unknown dependency state was deleted or reset.

Normal replacement builds use local copied assets. They do not import, symlink or otherwise depend on the old repository. `pnpm verify:preservation` and operator-only regeneration commands are the exceptions and are machine-specific.

## 3. Route and indexing outcome

| Origin | Canonical base | Registry records | Baseline mappings | Indexable | Redirects |
|---|---|---:|---:|---:|---:|
| Portal | `https://digitracks.net` | 129 | 58 | 59 | 64 |
| Learn | `https://learn.digitracks.net` | 15 | 6 | 6 | 7 |
| SourceCraft | `https://sourcecraft.digitracks.net` | 293 | 139 | 5 | 146 |
| ProcureSherpa | `https://procuresherpa.digitracks.net` | 545 | 1 | 1 | 2 |
| LearnPMO | `https://learnpmo.digitracks.net` | 75 | 12 | 12 | 38 |
| HCM Fusion | `https://hcmfusion.digitracks.net` | 1,273 | 168 | 3 | 636 |
| **Total** | | **2,330** | **384** | **86** | **893** |

The difference between 384 preserved baseline mappings and 86 indexable pages is intentional. Rights-reserved, editorially unapproved, blocked, private, retired and hash-only routes are not promoted into search merely because a URL existed before.

Verified behavior includes:

- One canonical host, trailing-slash policy, robots declaration and sitemap per origin.
- Permanent, same-origin, one-hop redirect manifests.
- Real static noindex 404 documents; no SPA fallback for unknown public paths.
- SourceCraft term routes remain noindex/in-review; regional packs remain blocked except the regional index.
- HCM Fusion publishes only three independently authored indexable evidence surfaces.
- ProcureSherpa hash routes remain non-indexable.
- SourceCraft and LearnPMO have install manifests; only SourceCraft registers a service worker.
- Verification ran before the initial content commit, so those recorded sitemaps omit `lastmod` rather than inventing build-date freshness. Subsequent builds from a full-history checkout must derive it from Git.

The full 37-entry product list and availability labels are in `IMPLEMENTATION_NOTES.md` section 4. Exact machine-readable route records are in `inventories/routes.json`; generated runtime records are in `packages/seo/src/route-registry.generated.ts`.

## 4. Addendum delivery

The strategic addendum is implemented locally:

- MIND ONE is the primary homepage flagship with a dedicated landing page, navigation position, practice instrument and product-bound CTA.
- MIND ONE Pro has a separate request-only route and an evidence-bounded comparison.
- Vedik and Nipuna have distinct positioning, audiences, capability boundaries and visual treatments.
- Procurement is a first-class ecosystem containing Vertex, Vantor, Procure Sherpa and ProcureSherpa Learning.
- Construction and Transportation remain reachable but are no longer primary homepage categories.
- Desktop/mobile navigation and the footer expose the portfolio hierarchically.
- Six industry pages contain specific challenges, workflows, product relationships, qualitative outcomes and CTAs.
- Visible industry/category “Estate” terminology is removed.
- Public product naming is **MIND ONE**, not `MINDONE`.
- Remote public GitHub research and the product-intelligence inventory are complete without cloning, ZIP downloads, repository modification or private-data exposure.

See `docs/ADDENDUM_GAP_ANALYSIS.md` and `docs/PRODUCT_INTELLIGENCE.md` for evidence boundaries and remaining owner blockers.

## 5. Automated verification

| Gate | Recorded result |
|---|---|
| Reference preservation | Pass; 297 tracked files unchanged and clean |
| Workspace typecheck | Pass; shared packages, Worker and all six Astro apps |
| Astro diagnostics | 0 errors, 0 warnings, 0 hints |
| Root unit tests | 19/19 passed across 3 files |
| Lead API tests | 104/104 passed across 7 files |
| Worker production dry-run build | Pass |
| Six public production builds | Pass; 869 HTML files |
| Security-header generation | Pass; six `_headers` files with exact inline-script hashes |
| Byte budgets | Pass; no failures |
| Estate verification | Pass; 2,330 routes, 86 indexable pages, 893 redirects, 130 governed assets |
| Full responsive route crawl | Pass; 86 routes, 344 states, 30,900 link references, 684 fragment references, zero issue groups |
| General estate browser suite | 25/25 passed |
| Configured enquiry-form suite | 15/15 passed |
| Resource-export analytics suite | 2/2 passed |
| Accessibility/browser audit | 40 checks; 0 axe violations; 0 browser-health failures |

Browser journeys cover CTA intent/product propagation, durable-receipt wording, validation focus, network uncertainty, abort behavior, bot-check failure/retry, analytics failure isolation, URL/history state, clear/undo, independent local storage, service-worker scope, private-route boundaries, real 404s, reduced motion, WebGL fallback, long product titles, flagship hierarchy, edition comparison, Procurement relationships, industry content and hierarchical navigation.

No names, emails, organisations, messages, tokens, credentials, URLs, query strings or free-text form content were found in browser analytics payloads. Analytics requests omit cookies, referer and authorization. An absent `PUBLIC_LEAD_ENDPOINT` sends no browser events.

## 6. Accessibility and browser health

The final audit covers 20 representative templates at 1440×900 and 390×844. Each check includes axe WCAG 2.2 AA rules, skip-link/focus behavior, one H1, one main landmark, horizontal-overflow measurement, security headers and browser health.

| Metric | Result |
|---|---:|
| Templates | 20 |
| Route/viewport checks | 40 |
| axe passed rules | 964 |
| axe incomplete checks | 30 |
| axe violations | 0 |
| Page errors | 0 |
| Console errors | 0 |
| Failed requests | 0 |
| HTTP 400+ responses | 0 |
| Horizontal overflow | 0 |

The 30 incomplete axe results require manual review; they are not counted as passes. Automated checks do not prove WCAG 2.2 AA conformance, screen-reader behavior, zoom/reflow across all content, cognitive accessibility or real-device usability.

Evidence: `artifacts/browser-audit.json`.

## 7. Responsive route crawl

The final crawl visits every approved indexable route at 1440×900, 1024×768, 768×1024 and 390×844.

| Metric | Result |
|---|---:|
| Routes | 86 |
| Page states | 344 |
| Link references | 30,900 |
| Fragment references | 684 |
| CSS references | 2,064 |
| Issue groups | 0 |
| Broken internal links | 0 |
| Fragment failures | 0 |
| CSS asset failures | 0 |

The crawler checks status, one H1/main, page-level overflow, broken/lazy images, clipped-text candidates, 24×24 controls with the WCAG spacing exception, 16px inputs, browser errors, failed requests, HTTP ≥400 responses, internal links and fragments. ProcureSherpa hash routes are covered by dedicated workspace tests.

Evidence: `artifacts/full-route-qa.json`.

## 8. Transfer budgets

Method: gzip level 9 for HTML, CSS and JavaScript; real Chromium font requests at 390px and 1440px for every body-class template. Route-specific CSS is inlined into HTML; the table reports the remaining external common CSS request.

| Origin | HTML files | Max HTML gzip | Max initial JS gzip | Max external CSS gzip | Max font transfer |
|---|---:|---:|---:|---:|---:|
| Portal | 62 | 43,035 B | 2,708 B | 4,110 B | 42,424 B |
| Learn | 7 | 8,020 B | 326 B | 4,110 B | 42,424 B |
| SourceCraft | 142 | 18,002 B | 2,637 B | 4,110 B | 42,424 B |
| ProcureSherpa | 2 | 20,176 B | 2,483 B | 4,110 B | 42,424 B |
| LearnPMO | 30 | 4,905 B | 326 B | 4,110 B | 42,424 B |
| HCM Fusion | 626 | 5,999 B | 326 B | 4,110 B | 42,424 B |
| **Limit** | | **100,000 B** | **75,000 B** | **60,000 B** | **80,000 B** |

The heavy Three.js chunk is lazy-loaded and is not part of the initial JavaScript budget. The global analytics bridge is included in the measured initial payload.

Evidence: `artifacts/budgets.json`.

## 9. Lighthouse performance

The final matrix was measured after rebuilding all six origins from the route/origin CSS partition.

| Origin | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT | Transfer |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Portal | 98 | 100 | 100 | 100 | 2,013.7 ms | 0 | 0 ms | 371,415 B |
| Learn | 100 | 100 | 100 | 100 | 935.8 ms | 0.001305 | 0 ms | 114,506 B |
| SourceCraft | 99 | 100 | 100 | 100 | 1,736.9 ms | 0.000779 | 0 ms | 246,053 B |
| ProcureSherpa | 98 | 100 | 100 | 100 | 1,802.4 ms | 0.000748 | 7 ms | 516,944 B |
| LearnPMO | 100 | 100 | 100 | 100 | 916.5 ms | 0 | 0 ms | 156,579 B |
| HCM Fusion | 100 | 100 | 100 | 100 | 1,501.9 ms | 0.001346 | 60.4 ms | 106,193 B |

Recorded method: local static preview, simulated mobile throttling, 412×823 viewport and DPR 1.75. Gates are performance ≥95, LCP ≤2,500 ms, CLS ≤0.1 and INP ≤200 ms when present. Lighthouse INP is `null` for all six reports and remains unmeasured. These are local simulated results, not field or production evidence.

Evidence: `artifacts/lighthouse-portal.json`, `artifacts/lighthouse-learn.json`, `artifacts/lighthouse-sourcecraft.json`, `artifacts/lighthouse-procuresherpa.json`, `artifacts/lighthouse-learnpmo.json`, `artifacts/lighthouse-hcmfusion.json` and `artifacts/browser-audit.json`.

## 10. Stylesheet architecture correction

Before the final partition, Portal transferred approximately 149 KB of CSS per template and Lighthouse reported approximately 70% unused CSS on the homepage. Child origins also downloaded styles for unrelated applications.

The delivered architecture:

- Keeps shared shell/design-system rules in `base.css`.
- Removes exact duplicate shared rules from page-family and origin files.
- Partitions Portal CSS into common, home, flagship, procurement, industry, services, catalogue, product and contact families.
- Partitions child CSS by origin.
- Inlines route/origin-specific CSS through `SiteLayout`.
- Retains only the small cacheable common stylesheet as an external CSS request.

This improved Portal LCP from 3,230.1ms to 2,013.7ms and SourceCraft LCP from 2,702.0ms to 1,736.9ms in the recorded local runs. The superseded `global.css` and `origins.css` are not imported by runtime layouts.

## 11. Visual and responsive evidence

The final visual pass uses the official Digi Tracks lockup, favicon, install icons and 33 unique official product marks. The rejected paper-only layout and radial orbital web are absent. The homepage carries the original **DT—01 / Systems Engine / Exploded Architecture** sculpture.

Measured visual evidence:

- MIND ONE at 1536×864: 1,488px shell width, 24px side insets, 110.592px H1, zero horizontal overflow and zero page errors.
- MIND ONE full-page captures reviewed at 1536px and 390px after the final CSS partition.
- Homepage at 1440×900, 1024×768 and 768×1024: one ready WebGL canvas.
- Homepage at 390×844 and under reduced motion: static fallback, zero canvases.
- All 86 indexable routes pass the four-width responsive crawl.
- Long product titles wrap rather than ellipsise; capability icons follow semantic meaning.
- Shared navigation/footer controls meet the 24px minimum with the WCAG spacing exception.
- Inputs use at least 16px type to avoid mobile focus zoom.
- Learn utility routes are excluded from learning-product navigation.

Evidence: `artifacts/mindone-final-1536.png`, `artifacts/mindone-final-390.png`, `artifacts/visual-identity/refined-visual-measurements.json`, `artifacts/visual-identity/refined-*.png` and `artifacts/full-route-qa.json`.

## 12. Security, lead and delivery semantics

Verified implementation boundaries include:

- Exact-origin checks, approximate per-isolate abuse limits, declared/streamed body caps and schema validation.
- A 20,000-byte lead body cap and a 2,000-byte browser-event cap.
- Fail-closed missing/incoherent Turnstile configuration.
- Durable D1 lead/idempotency/outbox commit before HTTP 202 `received`.
- Queue-based Resend and signed HTTPS CRM delivery with bounded retry, permanent-failure and dead-letter states.
- HMAC-SHA-256 over timestamp plus raw body, stable delivery IDs, replay window and receiver deduplication contract.
- Stable 24-hour Resend idempotency keys.
- Operator-only, product-bound, expiring, revocable, single-use demo grants with server-configured destinations.
- No client-selected recipient or arbitrary redirect.
- CSP, `nosniff`, strict referrer policy, frame denial, same-origin opener/resource policy and HSTS in generated headers.
- Contextual `mailto:contact@digitracks.net` fallback when durable form configuration is absent; no form data is collected in that state.

Provider acceptance is never described as inbox or CRM receipt. `/api/lead/health` proves D1/Queue/Turnstile readiness only. Real Resend delivery, CRM acknowledgement and demo destinations remain untested because credentials and receivers were not supplied.

Evidence: `artifacts/security-headers.json`, `apps/lead-api/tests/` and `tests/e2e/lead-form.spec.ts`.

## 13. Historical audit and competitor research

The historical estate audit records 41 claims and 38 defects/evidence gaps. It found material issues including pre-submission HCM answer exposure, contradictory indexing policy, rights-reserved editorial content, soft 404 application shells, duplicate canonical forms, missing CSPs and unproven durable lead/CRM delivery.

The replacement avoids republishing affected answer keys and unapproved editorial records, establishes real 404s and coherent indexing, and implements durable delivery contracts. It does not modify or claim to repair the old production source.

Competitor research covers eight official public products/adjacent services with 54 dated sources: Odoo, ERPNext, Procurify, Oracle University, Superset, Semgrep, Cliniko and Fresha. It informs workflow-led IA, transparent scoping, docs-led adoption and qualified demos without copying proprietary assets or inventing proof.

Evidence: `docs/WEBSITE_AUDIT.md`, `inventories/claims.json`, `inventories/defects.json` and `docs/COMPETITOR_ANALYSIS.md`.

## 14. Production blockers and unknowns

| Area | Status / required owner action |
|---|---|
| Cloudflare resources | Provision D1, delivery Queue, dead-letter Queue, Analytics Engine and API-only Worker routing; replace `REPLACE_WITH_D1_DATABASE_ID` |
| Email | Supply Resend account/key, verified From/Reply-To/destination addresses and test inbox evidence |
| CRM | Supply staging HTTPS URL, auth/signing secret, mapping, idempotency, timeout and receiver test evidence |
| Turnstile | Supply coherent site/secret keys, hostnames, action and approved privacy wording |
| Demo access | Supply real product destinations, qualification policy and issuance/revocation operating procedure |
| Editorial rights | Approve SourceCraft/HCM Fusion content or keep it blocked/noindex |
| Application parity | Supply authorised ProcureSherpa/LearnPMO/HCM Fusion source, schemas, fixtures and rules |
| MIND ONE identity | Supply approved MIND ONE/MIND ONE Pro marks or retain the neutral identifier |
| Asset provenance | Approve any visual asset beyond the supplied Digi Tracks identity set |
| Business proof | Supply genuine identity/customer/security proof before publishing it; none is invented |
| Analytics governance | Approve consent/retention policy, production dataset, dashboards and access; volumes remain `UNKNOWN` |
| SEO operations | Verify Search Console properties and submit sitemaps; local generation does not prove acceptance |
| Hosting/release | Approve per-origin hosting, redirects, monitoring, backups, rollback and cutover |
| Field quality | Measure real-user Core Web Vitals, INP, device/browser coverage and assistive-technology behavior |
| CI/deployment | No CI workflow, Pages project manifest or deploy script is included |

Legacy portal `/api/lead` and `/api/send-email` redirect records are not evidence of same-host API routing. Production must explicitly route the approved API origin.

## 15. Reproduce the checks

Use Node 24.x and pnpm 12.16.1 from the project root.

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm audit:routes
pnpm audit:performance
```

`pnpm verify` runs preservation, typecheck, unit/API tests, production builds, budgets, estate validation, accessibility, estate browser journeys, enquiry-form journeys, resource-export analytics and a final estate verification. The full-route crawl and Lighthouse matrix are explicit separate commands.

To run the public shells:

```bash
pnpm --filter './apps/*' --filter '!@digitracks/lead-api' --parallel dev
```

Local origins are ports 4321–4326 in the order Portal, Learn, SourceCraft, ProcureSherpa, LearnPMO and HCM Fusion. The enquiry form remains disabled until a lead endpoint and Turnstile site key are configured; an email fallback remains available.

## 16. Artifact index

| Artifact | Purpose |
|---|---|
| `artifacts/preservation-verification.json` | Reference HEAD, clean tree and tracked-hash result |
| `artifacts/estate-verification.json` | Route, HTML, indexing, redirect, social-image and asset counts |
| `artifacts/full-route-qa.json` | Final 86-route/344-state responsive/link crawl |
| `artifacts/budgets.json` | Per-origin/per-template transfer measurements |
| `artifacts/browser-audit.json` | Accessibility, browser-health and Lighthouse summaries |
| `artifacts/lighthouse-*.json` | Full six-origin Lighthouse reports |
| `artifacts/security-headers.json` | Generated CSP/hash counts per origin |
| `artifacts/mindone-final-1536.png` | Final full-page MIND ONE desktop capture |
| `artifacts/mindone-final-390.png` | Final full-page MIND ONE mobile capture |
| `artifacts/visual-identity/refined-visual-measurements.json` | Responsive sculpture and product-title measurements |
| `inventories/routes.json` | Exact historical route inventory |
| `inventories/source-assets.json` | Approved identity provenance and hashes |
| `inventories/generated-registry-summary.json` | Generated registry counts |
| `inventories/claims.json` | Claim/evidence register |
| `inventories/defects.json` | Prioritized historical defect register |

## Appendix A — exact indexable routes

### Portal — 59

- `/`
- `/about/`
- `/contact/`
- `/developer-tools/`
- `/engineering/`
- `/faq/`
- `/field-operations/`
- `/industries/`
- `/offline-first-software/`
- `/pricing/`
- `/procurement-software/`
- `/products/`
- `/products/campus-grid/`
- `/products/chronos/`
- `/products/construction-management/`
- `/products/glowra/`
- `/products/mindone-pro/`
- `/products/mindone/`
- `/products/mindone/compare/`
- `/products/nipuna/`
- `/products/opspilot/`
- `/products/orion-hunter/`
- `/products/orion/`
- `/products/procure5/`
- `/products/procure5/contractleak/`
- `/products/procure5/procuredecision/`
- `/products/procure5/procureleak/`
- `/products/procure5/procureoutcomes/`
- `/products/procure5/tenderguard/`
- `/products/quote-simulator/`
- `/products/recon/`
- `/products/sherpa-toolkit/`
- `/products/transportation-management/`
- `/products/unify/`
- `/products/unify/arventa/`
- `/products/unify/connexa/`
- `/products/unify/logistra/`
- `/products/unify/monexa/`
- `/products/unify/nexora/`
- `/products/unify/orbitra/`
- `/products/unify/planora/`
- `/products/unify/procura/`
- `/products/unify/workzen/`
- `/products/vantor/`
- `/products/vedik/`
- `/products/vedik/school-erp/`
- `/products/vedik/social-community/`
- `/products/vedik/university/`
- `/products/vedik/unnati/`
- `/products/vertex/`
- `/services/`
- `/solutions/`
- `/solutions/beauty-wellness/`
- `/solutions/business-operations/`
- `/solutions/education/`
- `/solutions/healthcare/`
- `/solutions/procurement/`
- `/solutions/recruitment/`
- `/trust/`

### Learn — 6

- `/`
- `/contact/`
- `/hcmfusion/`
- `/learnpmo/`
- `/procuresherpa/`
- `/sourcecraft/`

### SourceCraft — 5

- `/`
- `/about/`
- `/explore/`
- `/regions/`
- `/sources/`

### ProcureSherpa — 1

- `/`

### LearnPMO — 12

- `/assessments/`
- `/cohort/`
- `/controls/`
- `/dashboard/`
- `/documents/`
- `/exams/`
- `/industries/`
- `/lessons/`
- `/plan/`
- `/pmo/`
- `/portfolio/`
- `/programme/`

### HCM Fusion — 3

- `/`
- `/sources/gaps/`
- `/sources/releases/`
