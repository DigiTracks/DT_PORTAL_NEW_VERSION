# Digi Tracks estate evidence audit

**Audit date:** 25 November 2026 (UTC)

**Evidence generation timestamp:** `2026-11-25T00:31:19Z`

**Scope:** the existing six-host public estate; this audit is stored in the independent replacement workspace at `/data/HomeWorks/digitracks-nextgen-portal`

**Phase:** audit/evidence only — no implementation, deployment, DNS change, secret change or production cutover

**Historical baseline:** this document describes the estate at audit time. It is not a current approval list or a report on the replacement build; use `QA_REPORT.md` and `inventories/source-assets.json` for current evidence.

## 1. Executive assessment

The estate has a strong preservation baseline: all **384 sitemap URLs** across six origins returned **HTTP 200**, every sitemap URL has a canonical, and 383 of 384 have exactly one server-rendered H1. The portal/Learn source also preserves useful distinctions between freeware and open source, and the application hosts expose substantial stable content and route identifiers.

The estate is not ready to be copied forward as-is. Material issues include pre-submission assessment answer leakage, contradictory robots/indexability policy, indexable editorial-review content, application-shell soft 404s, duplicate canonical forms, missing CSPs, stale derived counts, heavy ProcureSherpa delivery, incomplete business proof, and no proven durable lead/CRM delivery. Rights-reserved content, application source and visual-asset permission remain explicit owner blockers.

The audit records **36 claims** and **38 defects/evidence gaps**. Fourteen defects are P1 release blockers, sixteen are P2, and eight are P3. One previously reported SourceCraft favourites defect is confirmed resolved. No accessibility, Lighthouse, Core Web Vitals or full mobile conformance is claimed.

## 2. Method, scope and preservation

### 2.1 Method

- Parsed each live `/sitemap.xml` and performed safe, read-only HTTP GETs with the audit User-Agent.
- Measured document status, redirects, content type, response bytes, title, canonical, robots meta, H1 count, JSON-LD blocks and OG/Twitter image presence where applicable.
- Crawled public links from all HCM Fusion sitemap pages and public indexes, then measured the additional route families.
- Read local source only for portal/Learn facts. Used public pages and public JavaScript only for SourceCraft, ProcureSherpa, LearnPMO and HCM Fusion.
- Computed SHA-256 hashes and image dimensions by reading local candidates in place or by read-only public HTTP. No asset was copied into the new project.
- Did not submit forms, issue POST requests, execute client hash routes, mutate browser state, install packages, build, or modify any reference repository.
- Recorded `UNKNOWN` where behavior or evidence was not measured. A successful document-shell response does not prove a client route rendered or an authenticated workflow works.

### 2.2 Evidence labels

| Label | Meaning |
|---|---|
| `fresh_measured` / `fresh_verified` | Checked during this audit by safe HTTP, public source or read-only local source. |
| `prior_observed` | Supplied baseline or source-derived observation retained from before final inventory assembly. Original date is `UNKNOWN` where the brief did not supply one; the register records the 2026-11-25 intake date. |
| `UNKNOWN` | Not measured or not established. It is not replaced with a plausible value. |

### 2.3 Reference preservation

| Item | Evidence |
|---|---|
| Reference repository | `/data/HomeWorks/DT-Portal-main` |
| HEAD at audit start | `9a4a9af84a0447926aa96f1cc4b2210232f44ffb` |
| Working tree at audit start | clean |
| Tracked-file verification | 297/297 tracked-file SHA-256 values match the preservation snapshot captured at `2026-11-25T00:36:51.464Z`; no changed or missing files |
| Preservation record | `/data/HomeWorks/digitracks-nextgen-portal/inventories/preservation-baseline.json` |
| Hash snapshot | `/data/HomeWorks/digitracks-nextgen-portal/inventories/old-repo-tracked-hashes.json` |
| Mode | strictly read-only |

No runtime import, symlink, Git alternate, copied asset or workspace dependency may point back to the reference repository in the replacement.

### 2.4 Exclusions

CostPilot, VendorIQ, TalentMap and ComplyFlow are excluded from product schema, request forms, navigation and sitemaps. `stats.digitracks.net` is non-indexable, returned **520**, and is not a seventh public replacement target. No personal GitHub account is linked by this audit.

## 3. Live sitemap baseline

All counts below were reconfirmed from the live sitemaps on 25 November 2026. All listed document GETs returned 200.

| Origin | Sitemap URLs | Fresh 200 | Canonical | Exactly one H1 | JSON-LD | Missing OG/Twitter image | Hosting |
|---|---:|---:|---:|---:|---:|---:|---|
| `https://digitracks.net` | 58 | 58 | 58 | 58 | 58 | 0 | Cloudflare |
| `https://learn.digitracks.net` | 6 | 6 | 6 | 6 | 6 | 0 | Cloudflare |
| `https://sourcecraft.digitracks.net` | 139 | 139 | 139 | 139 | 0 | 0 | Vercel |
| `https://procuresherpa.digitracks.net` | 1 | 1 | 1 | 0 | 1 | 1 | Vercel |
| `https://learnpmo.digitracks.net` | 12 | 12 | 12 | 12 | 0 | 12 | Vercel |
| `https://hcmfusion.digitracks.net` | 168 | 168 | 168 | 168 | 0 | 168 | Vercel |
| **Total** | **384** | **384** | **384** | **383** | **65** | **181** | Cloudflare 64 / Vercel 320 |

### 3.1 Exact composition

- **Portal — 58:** 17 flagship product routes, 18 nested product routes, six solution routes, two capability hubs, industries and utility/marketing pages.
- **Learn — 6:** `/`, `/procuresherpa`, `/learnpmo`, `/hcmfusion`, `/sourcecraft`, `/contact`.
- **SourceCraft — 139:** seven index/utility pages, 122 term pages and ten region paths. The ten region paths comprise the regional index plus nine regional packs.
- **ProcureSherpa — 1:** the application document shell `/`.
- **LearnPMO — 12:** `/dashboard`, `/lessons`, `/exams`, `/assessments`, `/industries`, `/pmo`, `/programme`, `/portfolio`, `/controls`, `/documents`, `/cohort`, `/plan`.
- **HCM Fusion — 168:** 16 index/utility pages, 47 lessons, 70 concepts, 26 glossary entries and nine course pages.

The SourceCraft composition is recorded as **7 + 122 + 10 = 139**. This reconciles the earlier shorthand of “eight index/utility pages and nine packs”: the sitemap contains a regional index path in addition to the seven top-level index/utility pages.

## 4. Additional route surface and reconciliation

The route inventory contains **1,443 deterministic records**. This is not an indexable-URL count: it includes the 384 sitemap URLs, utility/API probes, redirect aliases, application/user routes, 506 source-derived ProcureSherpa hash-content routes and excluded-host evidence.

| Route class | Records | Interpretation |
|---|---:|---|
| `public-seo` | 1,324 | Semantically public content; current indexability is recorded separately and is not automatic approval. |
| `public-utility` | 91 | PWA, crawl, export, shell and utility behavior. |
| `private` | 17 | Account, local-workspace, API or user-state boundaries. |
| `administrative` | 1 | Administrative probe. |
| `retired` | 10 | Aliases, defect probes, missing routes and the excluded stats host. |

### 4.1 SourceCraft

Fresh targeted evidence includes:

- `/favourites/` → **200**, canonical `/favourites/`, `noindex, follow`.
- `/favourites` → **200** with the same bytes; no redirect.
- `/offline/` → **200**.
- `/data/library.json` → **200**, JSON, **235,272 bytes**.
- `/sw.js` → **200**, JavaScript, **11,507 bytes**.
- `/manifest.webmanifest` → **200**.
- `/library.json` → **404**; the implemented public data path is `/data/library.json`.
- `/terms/batna/` and `/terms/batna` → **200** with identical **74,208-byte** responses.
- `/explore` and `/explore/`, and `/regions/IN` and `/regions/IN/`, both return 200.

The prior “broken favourites” finding no longer reproduces. It is retained as `DEF-028`, status `resolved`, rather than repeated as a current failure. Browser favourites/recents migration remains untested; the plan's `source-craft:favourites:v1` and `source-craft:recent:v1` keys were not confirmed in the inspected chunks.

### 4.2 ProcureSherpa

Public source defines the typed route model:

- **393 library records** across eight content types.
- **390 unique library IDs**; `make-or-buy`, `framework-agreement` and `supplier-financial-risk` each occur in both `kb` and `dec` namespaces.
- **94 academy functions**.
- **19 calculators**, defined inline in the homepage.
- **506 unique typed hash-content routes** in total.
- **11 help records** and **23 application/utility hash routes** recorded separately.

The earlier **503** figure is corrected to **506**. It counted unique IDs without the type namespace; the three duplicate IDs generate distinct typed URLs. The document shell returned 200, but hash fragments are not sent to the server and individual client rendering was not executed. Every hash-content route therefore has `currentStatus: UNKNOWN`, `documentStatus: 200` and `clientRouteStatus: UNKNOWN`.

### 4.3 LearnPMO

The known page surface is **33 paths**: root + 12 sitemap pages + 20 additional linked application/workspace paths.

- `/` → **307** to `/dashboard`.
- `/definitely-not-a-real-route-audit` → **200 application shell**, currently `robots: index, follow`.
- `/api/` → **308** to `/api`.
- `/api` → **200 HTML application shell**.
- `/manifest.webmanifest`, `/site.webmanifest` and `/favicon.ico` → **200 HTML**, not the expected manifest/icon types.

The unknown-route probe is now more clearly indexable than the earlier noindex observation. The fresh measurement governs the register.

### 4.4 HCM Fusion

Crawling all 168 sitemap pages plus public indexes found **462 additional linked paths**. `/profile` and `/progress`, named in robots/source evidence, bring the known additional total to **464**:

| Additional family | Paths | Fresh document status |
|---|---:|---|
| `/evidence/claims/<ID>` | 371 | all 200 |
| `/practice/quizzes/<slug>` | 47 | all 200 |
| `/certifications/<slug>` | 4 | all 200 |
| `/learn/sops/<slug>` | 3 | all 200 |
| `/practice/scenarios/<slug>` | 2 | all 200 |
| `/export/module/<module>.<html\|md\|txt>` | 27 | all 200 |
| Unsitemapped courses | 3 | all 200 |
| Application/user paths | 7 | measured individually |
| **Total** | **464** | |

The seven application/user paths are `/analytics`, `/learn/recall`, `/learn/saved`, `/learn/tutor`, `/login`, `/profile` and `/progress`.

Additional probes:

- `/evidence` → **404**; `/evidence/` → **308** to `/evidence`.
- `/api/` → **308** to `/api`; `/api` → **404** on safe GET.
- `/admin` → **200**, `noindex, nofollow`.

The earlier “463 additional routes” is reconciled as 462 public links plus `/profile` and `/progress`. The current inventory does not force the older total.

The 27 exports cover nine modules in HTML, Markdown and text. All returned 200. The exports show an export date of **2026-10-05**. Core HR reports 6/24 lessons and six assessments; Absence reports 22/22 lessons and 22 assessments.

### 4.5 Portal API and excluded stats origin

- `/api/send-email` and `/api/lead` returned **405** to safe GET. No POST or form submission was performed.
- `https://stats.digitracks.net/` returned **520**. It is recorded as excluded/retired evidence only.

## 5. Portal and Learn source findings

### 5.1 Catalogue and availability

- `PRODUCTS` contains **17 flagships**.
- `UNIFY_MODULES` contributes nine, `VEDIK_MODULES` four and `PROCURE5_SYSTEMS` five: **18 nested products**.
- `ALL_PRODUCTS` therefore contains **35 products**.
- Six solution slugs and two capability hubs are defined.
- MIND ONE is presented as pre-launch/wait-state.
- Orion is presented as a proprietary public preview.
- Chronos and Unify demos are gated.
- Learning platforms are not duplicated in `ALL_PRODUCTS`.

These are source-defined facts, not proof that every product is generally available, production-ready or customer-validated.

### 5.2 Licence and buying-model distinctions

| Product | Evidence | Safe interpretation |
|---|---|---|
| OpsPilot | Local Apache-2.0 metadata; npm `@ops_pilot/cli` 0.1.6 reports Apache-2.0 | Published CLI package is Apache-2.0. Do not extend that to unrelated assets/content. |
| Recon | Local FREEWARE model; npm reports `SEE LICENSE IN LICENSE`; proprietary licence text fetched | Proprietary, free to install for permitted internal executable use, closed source; not open source. |
| Vantor | Portal states AGPL-3.0-or-later; AGPL text verified | Site-stated only. Public source availability and compliance are unverified. |
| Other products | Product-specific source fields | Do not infer a licence from price, preview status or repository presence. |

Licence-text SHA-256 values:

- Recon proprietary licence: `c5bbc2b24785a61a20c655e0040ce172484dd4d3f9b251d5f54ab78798dd3cc1`
- Apache 2.0 text: `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30`
- AGPL 3.0 text: `0d96a4ff68ad6d4b6f1f30f713b18d5184912ba8dd389f86aa7710db079abcb0`

These hashes verify text identity, not ownership of every asset or the existence of corresponding product source.

### 5.3 Identity, proof and conversion

- `PAYMENT_LINKS` is empty; buying models are quote-led and no public numeric prices are configured.
- `TESTIMONIALS` is empty; no genuine customer proof is present in the inspected source.
- `STUDIO` contains the studio name and `contact@digitracks.net`; country is empty and founder, legal entity, city, phone and owned social profile are unset.
- The worker sends email directly through `/api/send-email` and `/api/lead`.
- No durable D1 insert, outbox, queue, dead-letter path or signed CRM webhook is implemented in the inspected source.
- Turnstile is optional. The live portal CSP has no Turnstile host, consistent with bot verification being off.
- Source comments state that the Cloudflare Rate Limiting binding did not enforce in live testing. Compensating controls are per-isolate memory limits, optional Turnstile and an owner-managed WAF rule; WAF enforcement was not inspected.

### 5.4 Learn handoffs

The six Learn routes map to portal products as follows: ProcureSherpa → `sherpa-toolkit`, LearnPMO → `learnpmo`, HCM Fusion → `hcmfusion`, SourceCraft → `sourcecraft`. These mappings should be preserved explicitly.

## 6. Host findings

### 6.1 SourceCraft

**Strengths**

- Complete 139-URL sitemap with 200 responses, canonicals, one H1 and social-image tags on every page.
- Working saved-terms and offline routes in the fresh snapshot.
- Public library JSON and service worker support an offline-capable architecture.
- Clear public licensing split: application code is described as MIT, while term text and editorial/regional notes are explicitly all rights reserved.

**Material issues**

- All 122 inspected term records remain `in_review`; reviewed dates are null in inspected records, yet pages emit `index, follow`.
- Slash/no-slash aliases return duplicate 200 documents rather than redirecting.
- Explore uses generic homepage title/URL metadata; the system relies on `/og/default.png`.
- No JSON-LD appears on any of the 139 sitemap pages.
- Manifest declares 192×192 and 512×512 icons, but actual files are **192×175** and **512×465**. The maskable 512 icon is 512×512.
- The public MIT code statement does not clear term text, notes, diagrams or brand artwork for migration.

### 6.2 ProcureSherpa

**Strengths**

- Deterministic typed hash-route model with 506 unique content routes.
- Local-first positioning and public statements of no accounts, server storage or telemetry.
- Canonical and one JSON-LD block on the document shell.

**Material issues**

- The only sitemap URL has **no H1** in initial HTML and no OG/Twitter image.
- Homepage HTML measured **1,007,173 bytes**; `content.js` is approximately **2.92 MB**.
- No CSP header is present.
- Hash routes are source-derived only; rendering, calculators, exports, local persistence and privacy/network parity were not executed.
- Three IDs are reused across content types. Typed URLs remain unique, but registries must use composite `(type, id)` keys.
- Content and asset migration permission remain unverified.

### 6.3 LearnPMO

**Strengths**

- All 12 sitemap pages return 200 with canonical and one H1.
- Public links expose a broad workspace surface for route planning.

**Material issues**

- Unknown paths and `/api` return an indexable HTML application shell instead of a real 404.
- No JSON-LD or OG/Twitter images on the 12 sitemap pages.
- CSP uses nonces for scripts but permits broad `https:`/`wss:` connections and inline styles.
- HSTS is present for one year with `includeSubDomains`, but no `preload`.
- Public pages use `private, no-cache, no-store`.
- Manifest and favicon URLs return HTML.
- Local/demo mode, backup/import, cloud sync, authentication and tenant behavior remain untested and source-blocked.

### 6.4 HCM Fusion

**Strengths**

- Rich stable identifiers across 47 lessons, 70 concepts, 26 glossary entries, 371 evidence pages, 47 assessments, four certification papers, three SOPs, two scenarios and 27 exports.
- All 168 sitemap pages return 200 with canonical and one H1.
- Exports include alt text and long descriptions for diagrams, which is a useful accessibility foundation.
- The source register exposes gaps and release/provenance concepts rather than presenting every item as complete.

**Material issues**

- Assessment payload exposes `key`, `isCorrect`, `rationale` and `correctOrder` before submission.
- `/robots.txt` disallows `/evidence/` while 371 evidence pages are publicly linked; private/user routes such as `/profile` and `/progress` emit `index, follow`.
- The Core HR lesson and exports say seven setup steps but enumerate six configuration actions.
- Course/source totals are differently scoped or stale: 12 modules stated, nine course pages sitemapped, three more indexable; 446 claims stated internally versus 371 public evidence pages.
- All nine Markdown exports state **53 diagrams**. Across the 27 exports, HTML figures, Markdown diagram headings and text diagram headings each total **51**.
- No CSP, COOP or CORP headers are present.
- Public pages use private/no-store caching.
- Duplicate/slow unauthenticated API calls remain a prior observation without a fresh browser timing trace.
- Three valid courses are indexable but unsitemapped: Benefits, Global Payroll and Procurement.
- Editorial approval, assessment rules, tenant boundaries and migration permission remain owner blockers.

## 7. Security-header snapshot

All six roots returned `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY`. HSTS, referrer policy and permissions policy were present. This is a header snapshot, not a penetration test or WAF review.

| Origin | CSP | HSTS | COOP / CORP | Cache policy | Key note |
|---|---|---|---|---|---|
| Portal | Hashed inline script, self-hosted assets, optional analytics/Turnstile origins; `style-src` allows inline | 2 years, subdomains, preload | same-origin / same-origin | public, revalidate | Live CSP contains no Turnstile host. |
| Learn | Hashed inline script; self-hosted assets; inline styles | 2 years, subdomains, preload | same-origin / same-origin | public 300s, SWR 600s | Strongest current cache policy. |
| SourceCraft | `unsafe-inline` scripts and styles; self/worker sources | 2 years, subdomains, preload | same-origin / same-origin | public, revalidate | Inline script allowance weakens CSP. |
| ProcureSherpa | **Absent** | 2 years | same-origin / same-origin | public, revalidate | CSP is a P1 gap. |
| LearnPMO | Nonce scripts; broad external connect/image/font; inline styles | 1 year, subdomains, no preload | same-origin-allow-popups / same-origin | private, no-store | API namespace currently returns HTML. |
| HCM Fusion | **Absent** | 2 years, subdomains, preload | **Absent / absent** | private, no-store | CSP and isolation headers are material gaps. |

## 8. Accessibility evidence and limits

Static evidence only:

- ProcureSherpa's initial shell has no H1; this is a concrete heading-structure risk.
- HCM Fusion exports contain diagram alt text and long descriptions, a positive foundation for non-visual access.
- SourceCraft's manifest dimension mismatch can affect install/icon presentation, but is not itself a WCAG verdict.
- Form labels, error association, keyboard order, focus visibility, skip links, screen-reader behavior, zoom/reflow, reduced motion and authenticated workflows were not manually tested.
- No axe scan or assistive-technology session was performed.

**Conclusion:** accessibility conformance is `UNKNOWN`. The audit does not claim WCAG 2.2 AA or any automated/manual conformance level.

## 9. Performance evidence and limits

Measured transfer/cache evidence:

- ProcureSherpa homepage HTML: **1,007,173 bytes**.
- ProcureSherpa `content.js`: approximately **2.92 MB**.
- SourceCraft public library JSON: **235,272 bytes**.
- SourceCraft service worker: **11,507 bytes**.
- HCM Fusion and LearnPMO public documents use private/no-store caching.
- HCM Fusion duplicate/slow API calls are a prior observation only; request counts and timings remain `UNKNOWN`.

No Lighthouse run, mobile throttling test, browser trace, field RUM data or Core Web Vitals measurement was performed. HTML/JavaScript transfer size is not LCP, INP or CLS.

**Conclusion:** performance targets and scores are `UNKNOWN`. The audit identifies likely bottlenecks but does not claim Lighthouse ≥95, LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 or full mobile conformance.

## 10. SEO and conversion findings

### SEO

- Canonical coverage is complete across the 384 sitemap URLs.
- JSON-LD appears on only **65/384**: portal 58, Learn 6 and ProcureSherpa 1.
- **181/384** lack OG/Twitter images: ProcureSherpa 1, LearnPMO 12 and HCM Fusion 168.
- SourceCraft has social tags on all 139 pages, but inspected metadata is generic/default rather than page-specific.
- Duplicate SourceCraft URL forms, LearnPMO soft 404s, HCM robots conflicts and unsitemapped HCM courses need explicit policy.
- Search Console acceptance, IndexNow submission and indexing outcomes are `UNKNOWN`.
- Structured data must be added only where supported by verified facts; no invented ratings, reviews, prices, offers, instructors or credentials.

### Conversion and trust

- Quote-led licensing is intentional; no public numeric price list or checkout is configured.
- Missing genuine customer proof and incomplete identity weaken trust. Neither should be filled with invented testimonials, logos or company details.
- Current lead handling proves only a direct-email code path, not durable receipt, retry or CRM delivery.
- No live form was submitted; real Resend inbox receipt and webhook behavior are `UNKNOWN`.
- MIND ONE must remain clearly pre-launch; preview/gated products must not be described as proven production deployments.

## 11. Asset and provenance findings

`inventories/assets.json` contains **100 records**:

| Clearance category | Count | Meaning |
|---|---:|---|
| Unknown provenance | 85 | Repository/public presence only; not approved for reuse. |
| Generated placeholder | 9 | Script-generated product wordmarks; not verified product identities. |
| Open-licence candidate | 2 | Instrument Sans and JetBrains Mono with local OFL evidence. |
| Do not use | 1 | Inter has OFL evidence but is prohibited by the approved plan. |
| Verified licence text | 3 | Evidence artifacts only; not visual-asset clearance. |
| **Owned/approved visual assets** | **0** | No supplied ownership/reuse approval. |

Additional facts:

- Portal brand lockup measurements are **729×120** in local source; dimensions do not prove ownership.
- SourceCraft public icon/social files are hashed and measured, but their ownership and reuse permission are unknown.
- No screenshot, photo, logo, icon or social card is cleared without ownership/licence evidence and an approval date.
- Open-font candidates still require retained licence/copyright notices and final source/destination hashes.
- Public crawlability is not redistribution permission.

## 12. Strengths to preserve

1. A complete, measurable 384-URL sitemap baseline with 384/384 fresh 200 responses.
2. Same-origin canonicals on all sitemap URLs and one H1 on 383/384.
3. Explicit freeware/open-source/proprietary distinctions in portal/Learn source.
4. SourceCraft offline data, service worker, saved-terms route and clear code/content licence boundary.
5. ProcureSherpa's deterministic typed deep-link model and local-first product direction.
6. HCM Fusion's stable lesson/concept/evidence/assessment/export identifiers and gap/release registers.
7. HCM export alt text and long descriptions as a starting point for accessible diagrams.
8. Existing bounded validation, fixed recipients and escaping patterns in the portal email code as reference material.
9. A clean, pinned reference-repository baseline that can be used for preservation checks.

## 13. Prioritized defects

The complete register is in `inventories/defects.json`: **38 records — 14 P1, 16 P2, 8 P3**. Status totals are 30 open, three blocked, three evidence gaps, one resolved and one accepted exclusion.

| Priority | ID | Defect | Required direction |
|---|---|---|---|
| P1 | DEF-001 | HCM assessment answers/rationales in pre-submission payload | Keep answer/scoring material server-side until validated submission. |
| P1 | DEF-002 | HCM robots/indexability conflict | Approve and enforce one route-level policy. |
| P1 | DEF-003 | 122 SourceCraft `in_review` terms are indexable | Editorial approval before indexing/migration. |
| P1 | DEF-004 | Rights-reserved content has no migration permission | Written owner permission or independently authored content. |
| P1 | DEF-005 | Authorized app source/state/scoring schemas missing | Obtain source/data or keep parity blocked. |
| P1 | DEF-006 | Zero approved visual assets | Provenance, permission and approval records before reuse. |
| P1 | DEF-007 | No durable lead/outbox/CRM delivery proof | Implement and prove D1/outbox/queue/webhook semantics. |
| P1 | DEF-008 / DEF-009 | HCM Fusion and ProcureSherpa have no CSP | Generate and test strict per-origin CSPs. |
| P1 | DEF-011 | LearnPMO soft 404s and HTML API namespace | Route manifest and real 404/API behavior. |
| P1 | DEF-012 | HCM seven-versus-six configuration count | Correct one source and regenerate derivatives. |
| P1 | DEF-021 / DEF-022 | ProcureSherpa missing H1/social image and heavy shell | Server-render shell, add approved social card, split/measure delivery. |
| P1 | DEF-034 | Rate limiting unproven; bot verification inactive | Fail-closed bot checks and enforceable abuse controls. |
| P2 | DEF-014 | HCM exports claim 53 diagrams; actual total 51 | Derive counts and test format parity. |
| P2 | DEF-015 | SourceCraft duplicate slash/no-slash 200s | One canonical form and one-hop 308 aliases. |
| P2 | DEF-016 / DEF-018 | SourceCraft generic metadata and no JSON-LD | Unique approved metadata/schema on eligible content. |
| P2 | DEF-019 / DEF-020 | HCM/LearnPMO missing schema/social imagery | Add only approved, fact-supported structured data/cards. |
| P2 | DEF-023 | Incomplete portal identity and no customer proof | Obtain genuine evidence or omit claims. |
| P2 | DEF-031 | Accessibility/performance conformance unmeasured | Run full QA matrix; report real results and limits. |

## 14. Blockers and required owner inputs

The following are stop conditions, not tasks to fill with invented content:

1. **Content permission and editorial approval** for SourceCraft terms/notes and HCM Fusion lessons, concepts, glossary, evidence, assessments, procedures, scenarios and diagrams.
2. **Authorized application source/data** for ProcureSherpa, LearnPMO and HCM Fusion, including scoring, state schemas, migrations, roles, tenant boundaries and exports.
3. **Asset provenance and approval** for brand marks, product logos, screenshots, photography and diagrams.
4. **CRM staging contract**: HTTPS receiver, authentication, mapping, idempotency, timeout and test credentials.
5. **Email configuration**: approved domain, Resend account/key, From/Reply-To and destination inbox for end-to-end tests.
6. **Turnstile configuration**: production/test keys, hostnames and privacy wording; missing configuration must fail closed.
7. **Business identity and genuine proof**, if later supplied. Until then omit founder/legal-entity details, testimonials, customer logos, case studies, numeric prices and unsupported outcomes.
8. **Search Console/analytics access**, if available. External acceptance remains an owner action.
9. **HCM indexability and assessment policy**, including which evidence/export/course routes should be public and how scoring is protected.
10. **SourceCraft state schema/fixtures** for favourites, recents, regional preferences and offline migrations.

## 15. Known/unknown ledger

| Topic | Known | Unknown / not proven |
|---|---|---|
| Sitemap baseline | 384 URLs; 384 fresh 200 responses | Search indexing/acceptance |
| Portal catalogue | 17 flagships + 18 nested = 35 | Production readiness and customer validation per product |
| Licence boundary | OpsPilot Apache-2.0 package; Recon proprietary/freeware; Vantor site-stated AGPL | Vantor public source availability/compliance; rights to every asset |
| SourceCraft editorial state | 122 terms `in_review`; nine packs | Reviewer approval and migration permission |
| SourceCraft favourites | `/favourites/` 200/noindex | Browser persistence and migration keys |
| ProcureSherpa routes | 506 typed hash-content routes | Client rendering, workflow parity, network/privacy parity |
| LearnPMO routes | 33 known paths; root 307; soft 404 confirmed | Auth, cloud sync, backup/import and tenant behavior |
| HCM content | 47 lessons, 70 concepts, 26 glossary, 371 public evidence pages | Editorial approval, internal 446-claim reconciliation, tenant/scoring rules |
| HCM assessment integrity | Answer material exposed in inspected payload | Full extent across all 47 assessments until tested |
| HCM exports | 27 exports, 51 diagram descriptions, stale 53 claim | Whether missing diagrams were intentionally removed |
| HCM API performance | Prior duplicate/slow-call report | Fresh request counts, timings and root cause |
| Security headers | CSP absent on HCM/ProcureSherpa; other header snapshot recorded | WAF rules, dependency vulnerabilities, penetration-test results |
| Lead delivery | Direct email code path | Durable receipt, retries, dead letters, real inbox/CRM delivery |
| Assets | 100 provenance records; zero approved visual assets | Ownership/permission for 85 unknown assets |
| Accessibility | One static H1 defect; HCM export descriptions observed | WCAG conformance, keyboard/screen-reader/zoom/reflow results |
| Performance | Shell/library transfer sizes and cache policies | Lighthouse, LCP, INP, CLS and device-matrix behavior |
| Business identity | Studio name/email published | Legal entity, founder, location, phone, owned social profiles |
| Customer proof | No testimonials/case studies in source | Any future genuine customer evidence |
| Operations | Cloudflare/Vercel split observed | Search Console, IndexNow, analytics and WAF operator state |

## 16. Handoff guidance

- Preserve the 384 sitemap mappings initially, but treat additional routes as a policy decision rather than automatic sitemap additions.
- Use `inventories/routes.json` as the exact origin/path/class/status baseline, including redirect targets, defect probes and source-derived hash routes.
- Use `inventories/claims.json` safe wording until stronger evidence is supplied. Do not promote `site-stated` or `unknown` claims to `verified`.
- Use `inventories/assets.json` as a candidate/provenance register, not an allowlist. No visual asset is approved yet.
- Use `inventories/defects.json` severity, evidence status and acceptance criteria to drive implementation and QA.
- Generate routes, metadata, schema, sitemaps, redirects and counts from one typed registry; do not reproduce the current duplicated/stale pattern.
- Keep each origin's localStorage, IndexedDB, service-worker cache and manifest namespace separate and versioned.
- Do not deploy or cut over under this audit authorization.

## 17. Deliverables

- `/data/HomeWorks/digitracks-nextgen-portal/docs/WEBSITE_AUDIT.md`
- `/data/HomeWorks/digitracks-nextgen-portal/inventories/routes.json`
- `/data/HomeWorks/digitracks-nextgen-portal/inventories/assets.json`
- `/data/HomeWorks/digitracks-nextgen-portal/inventories/claims.json`
- `/data/HomeWorks/digitracks-nextgen-portal/inventories/defects.json`

All JSON inventories include `generatedAt`, source/method notes and deterministic ordering. This audit work created only the five requested deliverables and did not modify other workspace files.
