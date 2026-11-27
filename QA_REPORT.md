# Digi Tracks next-generation estate — QA report

**Report date:** 27 November 2026

**Project root:** `/data/HomeWorks/digitracks-nextgen-portal`

**Release state:** final local automated verification and generated-output review complete; no deployment, DNS change, secret change or cutover

## 1. Current evidence status

The current replacement source and generated inventories were verified locally on 27 November 2026. The build, typecheck, unit/API tests, responsive crawl, estate validation, accessibility/browser-health audit, general browser journeys, configured enquiry-form journeys, analytics journeys and transfer budgets passed. The six-origin Lighthouse matrix is recorded separately in section 9.

This report distinguishes:

- **Current measured local evidence**, which verifies the implemented replacement within the stated automated scope.
- **Owner-blocked production evidence**, including real delivery, application parity, editorial permission, commercial entitlement, external dashboards, field performance and deployment approval.

No deployed production result, delivery, indexing, ranking, deployment or cutover result is claimed. Automated evidence does not prove WCAG conformance, field Core Web Vitals, measured INP, production behavior, customer outcomes, commercial entitlement, inbox/CRM receipt or search-engine acceptance.

## 2. Current scope and inventory

| Item | Current source/inventory fact |
|---|---|
| Public origins | Portal, Learn, SourceCraft, ProcureSherpa, LearnPMO and HCM Fusion |
| Catalogue entries | 37 |
| Source products | 27 |
| Source flagships | 13 |
| Request-only routes | 10 |
| Pre-launch routes | 2 |
| Nested products | 20 |
| Generated route records | 2,330 |
| Preserved baseline sitemap mappings | 384 |
| Indexable pages | 86 |
| Governed content records | 1,246 |
| Approved identity inventory | 40 owner-supplied assets plus two documented derivatives |
| Social-card asset inventory | 86 cards, 42 source assets and two font records: 130 governed asset records |

Source: `inventories/generated-registry-summary.json`, `inventories/social-cards.json` and `inventories/source-assets.json`.

The categories overlap and must not be added together. Route records include utility/private boundaries, aliases, redirects and hash routes; they are not emitted HTML pages. Governed content records are distinct from governed asset records. The `available` catalogue label is not independent evidence of production readiness or commercial entitlement.

## 3. Route and indexing model

| Origin | Canonical base | Registry records | Baseline mappings | Indexable records | Recorded redirect records |
|---|---|---:|---:|---:|---:|
| Portal | `https://digitracks.net` | 129 | 58 | 59 | 64 |
| Learn | `https://learn.digitracks.net` | 15 | 6 | 6 | 7 |
| SourceCraft | `https://sourcecraft.digitracks.net` | 293 | 139 | 5 | 146 |
| ProcureSherpa | `https://procuresherpa.digitracks.net` | 545 | 1 | 1 | 2 |
| LearnPMO | `https://learnpmo.digitracks.net` | 75 | 12 | 12 | 38 |
| HCM Fusion | `https://hcmfusion.digitracks.net` | 1,273 | 168 | 3 | 636 |
| **Total** | | **2,330** | **384** | **86** | **893** |

The current estate verification confirms 893 redirect records and 869 emitted HTML files: 86 indexable pages, 782 noindex pages and one redirect document. It also validates all 86 local social images and 130 governed asset records with zero errors or warnings.

The gap between 384 preserved baseline mappings and 86 indexable pages is intentional. Rights-reserved, editorially unapproved, blocked, private, retired and hash-only routes are not promoted into search merely because a URL existed before. Indexability requires an approved `public-seo` route. SourceCraft in-review content and rights-reserved HCM Fusion content remain governed/noindex records.

Each origin owns its canonical host, trailing-slash policy, robots declaration, sitemap and real static 404. Redirects are permanent, same-origin and one-hop. ProcureSherpa hash routes remain non-indexable. SourceCraft and LearnPMO have origin-aware install manifests; only SourceCraft registers a service worker. Sitemap `lastmod` values must come from defensible content history, not a uniform build date.

`stats.digitracks.net` remains outside the replacement scope and non-indexable.

## 4. Current implementation baseline

The reviewed implementation includes:

- Six independently buildable Astro shells with selective React islands.
- Registry-driven navigation, metadata, schema, redirects, CTAs, social cards and tests.
- One unified MIND ONE family block containing **MIND ONE Basic** and **MIND ONE Complete**.
- Stable internal IDs and URLs: `mindone` and `mindone-pro`, including `/products/mindone-pro/`.
- A registry-driven three-tier rotating orbit containing all 37 catalogue entries at regular angular intervals within each tier, plus a static featured product-deck fallback for ineligible sessions.
- A four-column footer and origin-aware header, footer, closing-section colors and lockup contrast.
- Distinct palettes and compositions for all six origins, plus origin-aware social cards and install manifests.
- SourceCraft local study/export tools and governed BATNA, Incoterms and total-cost-of-ownership reference cards.
- ProcureSherpa local-first hash workspace, LearnPMO public guides and HCM Fusion approved evidence pages.
- An API-only Cloudflare Worker for durable lead intake, asynchronous delivery and operator-controlled signed demo grants.

MIND ONE Basic and Complete are request-only and pre-launch. Complete's reviewed implemented scope includes durable local profiles and sessions, saved practice history, résumé/JD comparison, learning goals, progress tracking, role-development maps, source-attributed remote opportunity listings, app lock and diagnostics. This does not establish commercial entitlement, quotas, provider terms, billing, integrations, unmetered hosted use, production deployment or launch timing. No official edition marks were supplied.

UNIFY was rejected as the Complete-edition name because Unify is a separate nine-app ERP. Vedik comprises Vedik School, Unnati College, Vedik University, Vedik Social Community and Campus Grid; Campus Grid does not replace Vertex. Shared identity, SSO, deployment, schema or integration across those products has not been verified. Orion, Orion Hunter, Recon and OpsPilot are four distinct prime developer/security products.

### Current visual-system review

A dedicated Playwright review passed 33 route/viewport cases across 11 representative routes: Portal home, MIND ONE Basic, MIND ONE Complete, Orion, Procurement ecosystem, Services, Learn, SourceCraft, ProcureSherpa, LearnPMO Plan and HCM Fusion evidence gaps. Each case used reduced motion, waited for document fonts, captured the full page and viewport, sampled every visible HTML element with a direct text node, checked font usage and shell width, and asserted the Portal color, naming and résumé invariants. Full-page and viewport captures were also inspected manually; this is representative visual evidence, not a claim that every one of the 869 emitted documents was manually reviewed.

Measured Portal home results:

| Viewport | Shell | Body | Smallest visible functional text | Résumé label | Hero background |
|---|---:|---:|---:|---|---|
| 1920×1080 | 1,888px | 17px | 12.8px | Instrument Serif italic, 19.2px | `rgb(23, 63, 122)` |
| 1366×768 | 1,334px | 17px | 12.8px | Instrument Serif italic, 19.2px | `rgb(23, 63, 122)` |
| 390×844 | 366px | 16px | 12.8px | Instrument Serif where used | `rgb(23, 63, 122)` |

Across all 33 cases, the smallest functional text was 12.8px, the laptop body minimum was 17px, no undersized functional-text samples remained, and no document exceeded its viewport width. Active origin/Portal stylesheet declarations also maintain a `0.8rem` functional-type floor. Host Grotesk Variable and each used Instrument Serif face loaded in Chromium. The audit excludes `aria-hidden` decorative text, SVG, screen-reader-only text and hidden elements; the résumé-font check applies only to actual display labels. These measurements verify the implemented visual system, not field usability, complete zoom/reflow behavior or WCAG conformance.

Evidence: `artifacts/visual-review/metrics.json` and `artifacts/visual-review/`.

## 5. Current automated verification

The following table records the current local gate results. The final build, byte budgets, responsive crawl, estate validation, accessibility audit, browser journeys, form journeys and analytics journeys all passed. Lighthouse is recorded separately in section 9.

| Gate | Current result |
|---|---|
| Reference preservation | 297 tracked files unchanged and clean at reference HEAD `9a4a9af84a0447926aa96f1cc4b2210232f44ffb` |
| Workspace typecheck | Pass across shared packages, Worker and six Astro apps |
| Astro diagnostics | 0 errors, 0 warnings, 0 hints |
| Root unit tests | 28/28 passed across four files |
| Lead API tests | 104/104 passed across seven files |
| Worker production dry-run build | Pass |
| Six public production builds | Pass; 869 HTML files at the last verify-estate run. A later local build of `apps/*/dist` emits 872 HTML files (portal 63, sourcecraft 142, hcmfusion 626, learnpmo 30, learn 9, procuresherpa 2); re-run `pnpm verify:estate` to refresh the verified count |
| Security-header generation | Pass; six `_headers` files with exact inline-script hashes |
| Byte budgets | Pass; no failures |
| Estate verification | Pass; 2,330 routes, 86 indexable pages, 893 redirects, 130 governed assets |
| Full responsive route crawl | Pass; 86 routes, 344 states, 32,656 link references, 688 fragment references, 2,064 CSS references, zero issue groups |
| General estate browser suite | 39/39 passed, including the full-page visual-system review |
| Configured enquiry-form suite | 19 passed; one environment-specific case skipped in the safe configuration |
| Local fail-closed delivery guard | 1/1 passed with a production endpoint configured and external requests blocked |
| Resource-export analytics suite | 2/2 passed |
| Accessibility/browser audit | 40 checks; 968 axe passed rules, 36 incomplete checks, zero violations and zero browser-health failures |

Historical preservation caveat: an early command invoked pnpm from the reference working directory and created an untracked lockfile, which was removed. The tracked Git tree and all 297 tracked-file hashes were recorded as unchanged. Whole-directory byte preservation, including pre-existing ignored dependencies, was not proven.

## 6. Current accessibility and browser health

The current audit covered 20 representative templates at 1440×900 and 390×844. Each check included axe WCAG 2.2 AA rules, skip-link/focus behavior, one H1, one main landmark, horizontal-overflow measurement, security headers and browser health.

| Metric | Current result |
|---|---:|
| Templates | 20 |
| Route/viewport checks | 40 |
| axe passed rules | 968 |
| axe incomplete checks | 36 |
| axe violations | 0 |
| Page errors | 0 |
| Console errors | 0 |
| Failed requests | 0 |
| HTTP 400+ responses | 0 |
| Horizontal overflow | 0 |

The 36 incomplete axe results require manual review and are not passes. These results do not establish WCAG conformance, screen-reader behavior, complete zoom/reflow coverage, cognitive accessibility or real-device usability.

Evidence: `artifacts/browser-audit.json`.

## 7. Current responsive route crawl

| Metric | Current result |
|---|---:|
| Routes | 86 |
| Page states | 344 |
| Link references | 32,656 |
| Fragment references | 688 |
| CSS references | 2,064 |
| Issue groups | 0 |
| Broken internal links | 0 |
| Fragment failures | 0 |
| CSS asset failures | 0 |

The crawler checks status, one H1/main, page overflow, broken/lazy images, clipped-text candidates, control sizing with the WCAG spacing exception, 16px inputs, browser errors, failed requests, internal links and fragments. Each rendered lazy-image decode has a three-second bound; timeouts and decode failures are explicit issue groups rather than silent skips, so one pending image cannot freeze the crawl or create a false pass. Responsive-hidden duplicate images are excluded because the browser intentionally does not render or load them; visible broken images still fail. Request failures and HTTP 400+ responses are attributed to the document navigation that started the request, so an abort left by the previous page cannot fail the next page while current-page failures still block it. ProcureSherpa hash routes have dedicated workspace tests.

Evidence: `artifacts/full-route-qa.json`.

## 8. Current transfer budgets

Method: gzip level 9 for HTML, CSS and JavaScript; real Chromium font requests at 390px and 1440px for every body-class template. The local audit server intentionally sends uncompressed responses; reported gzip figures are offline measurements, not confirmed deployment compression. Route/origin-specific CSS is inlined where configured; shared layout/component CSS remains external.

| Origin | HTML files | Max HTML gzip | Max initial JS gzip | Max external CSS gzip | Max font transfer |
|---|---:|---:|---:|---:|---:|
| Portal | 62 | 38,099 B | 4,053 B | 6,458 B | 42,424 B |
| Learn | 7 | 11,221 B | 3,195 B | 5,162 B | 42,424 B |
| SourceCraft | 142 | 21,435 B | 5,507 B | 5,162 B | 42,424 B |
| ProcureSherpa | 2 | 24,355 B | 5,353 B | 5,162 B | 42,424 B |
| LearnPMO | 30 | 7,917 B | 3,195 B | 5,162 B | 42,424 B |
| HCM Fusion | 626 | 8,857 B | 3,195 B | 5,162 B | 42,424 B |
| **Limit** | | **100,000 B** | **75,000 B** | **60,000 B** | **80,000 B** |

The lazy Three.js chunk is excluded from initial JavaScript. The global analytics bridge is included. All six origins pass every budget.

Evidence: `artifacts/budgets.json`.

## 9. Current Lighthouse performance

| Origin | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT | Transfer |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Portal | 98 | 100 | 100 | 100 | 1,952.9 ms | 0.005211 | 0 ms | 397,892 B |
| Learn | 100 | 100 | 100 | 100 | 1,004.8 ms | 0.000411 | 0 ms | 129,960 B |
| SourceCraft | 99 | 100 | 100 | 100 | 1,719.8 ms | 0.004510 | 40 ms | 323,598 B |
| ProcureSherpa | 98 | 100 | 100 | 100 | 1,801.1 ms | 0 | 30 ms | 539,686 B |
| LearnPMO | 98 | 100 | 100 | 100 | 2,026.7 ms | 0 | 111 ms | 183,219 B |
| HCM Fusion | 99 | 100 | 100 | 100 | 1,652.4 ms | 0.000717 | 134 ms | 120,535 B |

Method: local static preview, simulated mobile throttling, 412×823 viewport and DPR 1.75. The unchanged gates are performance ≥95, LCP ≤2,500 ms, CLS ≤0.1 and INP ≤200 ms when present. Lighthouse INP was `null` for all six reports and remains unmeasured. These are current local simulated results, not field or production evidence.

The Portal home previously serialized the full public catalogue into both the sculpture and atlas islands. Narrowing those payloads reduced the home document from 288,637 to 191,068 uncompressed bytes and combined island props from 137,218 to 39,648 bytes; the final Portal Lighthouse run passed at performance 98 with LCP 1,952.9ms. Per-origin Lighthouse exceptions are now recorded explicitly in the combined artifact while the remaining origins continue, and the command exits nonzero instead of leaving a stale success report.

Evidence: `artifacts/lighthouse-*.json`.

## 10. Security, lead and delivery semantics

The reviewed implementation defines:

- Exact-origin checks, approximate per-isolate abuse limits, declared/streamed body caps and schema validation.
- A 20,000-byte lead body cap and a 2,000-byte browser-event cap.
- Fail-closed missing or incoherent Turnstile configuration.
- Durable D1 lead/idempotency/outbox commit before HTTP 202 `received`.
- Queue-based Resend and signed HTTPS CRM delivery with bounded retries, permanent-failure classification and dead-letter state.
- HMAC-SHA-256 over timestamp plus raw body, stable delivery IDs, replay windows and receiver deduplication.
- Stable 24-hour Resend idempotency keys.
- Product-bound, expiring, revocable, single-use demo grants with server-configured destinations.
- One catalogue-derived demo-eligibility rule across static/hydrated CTAs, contact URL and manual state, client validation, lead API validation and operator issuance: public, requestable and `available` products only.
- No client-selected recipient or arbitrary redirect.
- Privacy-safe allowlisted browser events without form text, cookies, local-storage values, tokens or personal data.
- A contextual `mailto:contact@digitracks.net` fallback when durable form configuration is absent; the page collects no form details in that state.
- Loopback-only navigation from all six local origins, including normal, Control-click, middle-click, keyboard and dynamically inserted links, without production requests. Double-slash pathnames are assigned onto the loopback URL rather than reparsed as network-path references, so they cannot replace the local authority.
- A shared endpoint resolver that permits loopback HTTP(S) delivery only from loopback pages and non-loopback HTTPS delivery only from published pages. A local preview configured with a production endpoint renders no form, loads no Turnstile script and contacts neither production nor the bot-verification provider.

Provider acceptance is not inbox or CRM receipt. `/api/lead/health` reports D1/Queue/Turnstile readiness only. Real Resend delivery, CRM acknowledgement and demo destinations remain untested because production credentials and receivers were not supplied. An enquiry is not product access, billing, a demo grant or commercial entitlement.

Evidence: `apps/lead-api/tests/`, `tests/e2e/lead-form.spec.ts` and `artifacts/security-headers.json`. The current API, form, local fail-closed guard and analytics results are recorded in section 5.

## 11. Production blockers and unknowns

| Area | Status / required owner action |
|---|---|
| Local verification | Current matrix and measured results are recorded in sections 5–9; they do not establish production readiness |
| Cloudflare resources | Provision D1, delivery Queue, dead-letter Queue, Analytics Engine and API-only Worker routing; replace `REPLACE_WITH_D1_DATABASE_ID` |
| Email | Supply Resend account/key, verified From/Reply-To/destination addresses and test inbox evidence |
| CRM | Supply staging HTTPS URL, signing secret, mapping, idempotency, timeout and receiver test evidence |
| Turnstile | Supply coherent site/secret keys, hostnames, action and approved privacy wording |
| Demo access | Supply real destinations, qualification policy and issuance/revocation procedure |
| MIND ONE commercial scope | Resolve Basic/Complete entitlement, quotas, provider terms, billing, integrations, deployment and launch policy |
| MIND ONE identity | Supply approved edition marks or retain neutral identifiers |
| Editorial rights | Approve SourceCraft/HCM Fusion content or keep it blocked/noindex |
| Application parity | Supply authorised ProcureSherpa/LearnPMO/HCM Fusion source, schemas, fixtures and rules |
| Vedik boundaries | Supply evidence before claiming shared identity, SSO, deployment, schema or integration across the five-product ecosystem |
| Business proof | Supply genuine identity/customer/security proof before publishing it |
| Analytics governance | Approve consent/retention policy, production dataset, dashboards and access; volumes remain `UNKNOWN` |
| SEO operations | Verify Search Console properties and submit sitemaps; local generation does not prove acceptance |
| Field quality | Measure real-user Core Web Vitals, INP, device/browser coverage and assistive-technology behavior |
| Hosting/release | Approve per-origin hosting, redirects, monitoring, backups, rollback and cutover |
| CI/deployment | No CI workflow, Pages project manifest or deploy script is included |

## 12. Verification execution

The final matrix ran from the project root with Node 24.22.3 and pnpm 12.16.1. The complete `pnpm verify` command exceeds the command runner's ten-minute limit, so it was executed as equivalent bounded groups without omitting or weakening a gate:

```bash
pnpm verify:preservation
pnpm typecheck
pnpm test
pnpm test:api
pnpm build
pnpm budget
pnpm audit:routes
pnpm verify:estate
pnpm audit:a11y
pnpm exec playwright test
pnpm test:lead-form
pnpm test:analytics
pnpm audit:performance
pnpm verify:estate
```

The direct Playwright invocation used the completed build and generated headers, so it is equivalent to the browser portion of `test:e2e` without rebuilding the estate again. The Lighthouse matrix ran separately. Preservation verification reads the reference repository and is machine-specific; normal builds use local assets.

The executed matrix covered the MIND ONE names/routes, 37-product orbit placement and fallback, unified family block, four-column footer, six origin palettes, origin-aware header/footer/close/lockup contrast, origin-aware social cards/manifests and current generated registries. Manual keyboard, zoom/reflow, reduced-motion and assistive-technology review remains separate from automated gates; the representative visual captures and reduced-motion browser journeys are recorded in sections 4 and 5.

## 13. Artifact index

| Artifact | Purpose |
|---|---|
| `artifacts/preservation-verification.json` | Current reference HEAD, clean-tree and tracked-hash result |
| `artifacts/estate-verification.json` | Current route, HTML, indexing, redirect, social-image and asset counts |
| `artifacts/full-route-qa.json` | Current 86-route/344-state responsive/link crawl |
| `artifacts/budgets.json` | Current per-origin/per-template transfer measurements |
| `artifacts/browser-audit.json` | Current accessibility, browser-health and Lighthouse summaries |
| `artifacts/lighthouse-*.json` | Current six-origin Lighthouse reports |
| `artifacts/security-headers.json` | Generated CSP/hash counts per origin |
| `artifacts/visual-review/metrics.json` | Current 33-case typography, font, shell, color and visible-text measurements |
| `artifacts/visual-review/` | Current full-page and viewport captures for 11 representative routes at three sizes |
| `inventories/generated-registry-summary.json` | Current generated registry counts |
| `inventories/social-cards.json` | Current origin-aware social-card and governed-asset inventory |
| `inventories/source-assets.json` | Approved identity provenance and hashes |
| `inventories/claims.json` | Claim/evidence register |
| `inventories/defects.json` | Prioritized historical defect register |
