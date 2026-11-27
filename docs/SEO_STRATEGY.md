# Digi Tracks SEO strategy

**Status:** implementation baseline

**Date:** 2026-11-27

**Scope:** six public origins and all classified additional routes

**Principle:** preserve proven URLs, make every indexable page independently useful, and emit metadata from one route registry

**Evidence status:** current local SEO, route, social-image, manifest, browser and performance checks passed; production indexing and field performance remain unproven

## 1. Objectives

1. Preserve the existing 384-URL sitemap baseline while exposing only approved, currently indexable routes to search engines.
2. Give every indexable page a unique, useful title, description, canonical, social representation and internal-link context.
3. Replace duplicated runtime/prerender/metadata registries with one typed source of truth.
4. Correct duplicate URLs, soft 404s, robots conflicts and stale structured data.
5. Make public reading content server-rendered and useful without JavaScript.
6. Avoid unsupported claims in content, metadata or schema.
7. Establish a measurable baseline without claiming rankings, traffic or Search Console acceptance that has not been observed.

## 2. Preserved baseline and current indexability

| Origin | Preserved sitemap mappings | Currently indexable | Known issue to address |
|---|---:|---:|---|
| `digitracks.net` | 58 | 59 | MIND ONE Complete, edition comparison and Services beyond the baseline |
| `learn.digitracks.net` | 6 | 6 | Cross-origin handoffs and ProcureSherpa Learning identity |
| `sourcecraft.digitracks.net` | 139 | 5 | Slash/no-slash duplicates and generic social metadata; preserve the working noindex favourites route |
| `procuresherpa.digitracks.net` | 1 | 1 | Approximately 506 deterministic hash routes outside sitemap |
| `learnpmo.digitracks.net` | 12 | 12 | Application-shell soft 404s |
| `hcmfusion.digitracks.net` | 168 | 3 | Robots conflict, additional public routes, cache/header issues |
| **Total** | **384** | **86** | Preserve mappings; gate indexing |

All 384 advertised URLs were observed returning 200 with self-canonical HTML during the research baseline. That observation does not prove current or future indexing. The generated registry currently marks **86 pages indexable**.

The current generated summary records 37 catalogue entries, 27 source products, 13 source flagships, 10 request-only routes, two pre-launch routes, 20 nested products, 2,330 route records and 1,246 governed content records. Content records are not indexable-page counts and are distinct from the 130 governed asset records.

A route is indexable only when it is `public-seo` and `contentStatus: "approved"`. Rights-blocked HCM content and in-review SourceCraft content remain reachable but emit `noindex, follow`; they are omitted from sitemaps and omit canonical, `og:url` and social images while retaining basic social metadata. Additional routes are classified as `public-seo`, `public-utility`, `private`, `administrative` or `retired` and do not enter a sitemap automatically.

`stats.digitracks.net` is excluded as non-indexable and unavailable during research.

## 3. Canonical and origin policy

- Every origin owns its canonical host.
- Canonicals never point to a sibling origin unless a deliberate permanent migration is documented and tested.
- One trailing-slash policy is selected per origin.
- Alternate slash/no-slash forms receive a permanent one-hop redirect.
- ProcureSherpa hash routes remain stable initially.
- Public reading routes are statically rendered; application hash routes use an explicit manifest.
- Unknown routes return a real HTTP 404 with `noindex`.
- No SPA fallback turns an unknown public URL into HTTP 200.

Noindex utility/application routes do not enter sitemaps. Their canonical/og:url policy follows the shared head model: indexable pages emit canonical and social URL; noindex pages omit fields that would vote for indexing.

Published HTML intentionally retains production canonicals and cross-origin links. When that HTML is opened on `localhost`, any `127.0.0.0/8` address, `::1` or an IPv4-mapped loopback IPv6 address, a browser-only bridge rewrites HTTP, HTTPS and protocol-relative links to the six known Digi Tracks origins to their configured loopback preview origins while preserving path, query and fragment. The bridge assigns those components onto the loopback URL so a double-slash pathname cannot replace its authority. This is a local navigation safeguard, not a canonical, sitemap or indexing change, and it never runs on a published host.

## 4. Single route registry

The route registry drives:

- Runtime routing.
- Static generation.
- Navigation and breadcrumbs.
- Titles and descriptions.
- Canonicals and robots directives.
- Open Graph and Twitter metadata.
- JSON-LD eligibility.
- Sitemaps.
- Redirects.
- Internal-link validation.
- CTA and analytics IDs.
- Tests.

Manifest generation rejects duplicate routes, missing route fields and malformed or unsafe redirect structures. `pnpm verify` additionally checks required files, governed assets, built metadata, canonicals, robots, sitemaps, social images, CSP, redirect manifests and reference preservation. Link and claim validation are limited to the implemented registry/template checks. A changed indexable-route count is reported as a warning rather than a build failure; these checks are not plain-build guarantees.

## 5. Metadata contract

Every currently indexable (`public-seo` and approved) page has:

- Unique, specific title.
- Useful meta description.
- Self-referential canonical.
- `og:title`, `og:description`, `og:type`, `og:url`, `og:image`, `og:image:width`, `og:image:height`, `og:image:alt`, `og:site_name`.
- Twitter card metadata and an approved image.
- Language and viewport declarations.
- One H1.
- Logical heading order.

Titles are written for humans first. Product names are not truncated in metadata templates. Descriptions summarise the page rather than repeating a generic estate slogan.

Utility/noindex pages still receive accurate titles and descriptions where useful, but do not emit indexing signals.

## 6. Social images

- Create original 1200×630 images from approved type marks, verified labels and technical diagrams.
- Do not fabricate product screenshots, customer proof or product UI.
- Store generated source and output hashes in the asset manifest.
- Use a stable route-to-image mapping.
- Keep text readable at small preview sizes.
- Provide meaningful alt text describing the card's actual content.
- No external image dependency is required at crawl time.

The generated estate has **86 local 1200×630 social cards for its 86 indexable pages**. Cards are deterministic, use owner-supplied lockups, local fonts, verified labels and origin-specific themes, and are generated without external network requests. Portal, Learn, SourceCraft, ProcureSherpa, LearnPMO and HCM Fusion have distinct card compositions. The social-card inventory records per-card hashes and generator/registry hashes; its 130 governed asset records comprise 86 cards, 42 source assets and two font records.

## 7. Structured data

JSON-LD is emitted only when the route's facts are verified.

Allowed types include:

- `Organization` and `WebSite` after business identity is verified.
- `SoftwareApplication` for verified software products.
- `Course` for approved courses with real provider/context.
- `DefinedTerm` for approved SourceCraft terms.
- `Article` for approved editorial content.
- `BreadcrumbList` for real breadcrumb trails.
- `FAQPage` only when visible, approved FAQ content exists.

Never invent:

- Ratings or review counts.
- Prices or offers.
- Customer logos or endorsements.
- Certifications or credentials.
- Founder/legal identity.
- Aggregate outcomes.

No product schema is emitted for pipeline-only concepts CostPilot, VendorIQ, TalentMap or ComplyFlow.

Structured data is generated in shared Astro components from route and product registry data; product JSON-LD is assembled in `RegistryPage.astro`. Claim registries remain governance evidence and are not consulted as a runtime schema source.

### Addendum routes and naming

- `/products/mindone/`, `/products/mindone-pro/` and `/products/mindone/compare/` use the visible names **MIND ONE Basic**, **MIND ONE Complete** and **Compare MIND ONE editions** in titles, descriptions, breadcrumbs and social cards.
- Internal IDs and URLs remain `mindone` and `mindone-pro`; public renaming does not change `/products/mindone-pro/`.
- The comparison describes reviewed implementation and unresolved commercial entitlements; it does not create offers, prices, ratings, quotas, billing, provider terms or unsupported edition capabilities.
- Both editions are described as request-only and pre-launch. No official edition mark is presented because none was supplied.
- Unify has its own nine-app ERP metadata and hierarchy. UNIFY is not used as an edition name because that would collide with the separate ERP.
- Vedik metadata covers the five-product education ecosystem without implying shared identity, SSO, deployment, schema or integration. Campus Grid does not replace Vertex.
- Orion, Orion Hunter, Recon and OpsPilot retain distinct titles, descriptions and schema records as four prime developer/security products.
- `/procurement-software/` uses a dedicated ecosystem title/description and breadcrumb while preserving its established URL.
- `/services/` has its own metadata and breadcrumb; it is not folded into product or solution copy.
- ProcureSherpa Learning retains its Learn-origin canonical and distinct learning metadata.
- Homepage and navigation metadata lead with product-led positioning and MIND ONE rather than a generic services or “estate” label.

## 8. Sitemaps and robots

### Sitemaps

- One same-origin sitemap per public host.
- Only approved, indexable `public-seo` routes.
- Absolute URLs on the owning canonical origin.
- Accurate `lastmod` from substantive content changes or full git history; omit the element when no defensible date exists.
- No build-date stamp on every URL.
- Valid XML, escaped URLs and stable ordering.
- An implemented cross-host sitemap index at the portal's `/sitemap-index.xml` lists all six `/sitemap.xml` URLs; each host's robots declaration still names its own same-origin sitemap.

Current generated sitemaps omit `lastmod` because no defensible date map is supplied to `buildSitemapXml`. A post-publication build must derive git-based `lastmod` from full history; a shallow checkout must fail rather than fabricate dates. Verified substantive content dates can be used independently when available.

### Robots

- One robots declaration per host.
- Names that host's own sitemap.
- Does not disallow indexable public content.
- Administrative/private routes are not discoverable through public navigation or sitemaps.
- Rights-blocked HCM Fusion `/evidence/` content remains reachable with `noindex, follow`; indexing requires owner permission and an approved policy, not a robots disallow that conflicts with crawlability.
- `stats.digitracks.net` remains non-indexable.

## 9. Redirects

- Maintain a versioned redirect register.
- Permanent redirects for deliberate URL changes.
- One hop only.
- No loops, chains or unrelated-origin destinations.
- Keep deliberate redirects for at least one year.
- Test slash variants and legacy forms.
- Do not change ProcureSherpa hash routes without separate evidence and approval.
- Preserve deep-link destinations before improving labels or grouping.

## 10. SourceCraft specifics

- Collapse slash/no-slash duplicates under one policy.
- Preserve `/favourites/` as a working noindex utility route; do not add it to the sitemap.
- Replace generic Explore/Twitter metadata with term/regional-pack-specific metadata.
- Add appropriate `DefinedTerm`/breadcrumb schema only for approved content.
- Keep `in-review` editorial status visible in governance; do not describe all terms as approved or indexable.
- Public library JSON and offline/PWA endpoints receive deliberate cache/index policy.

SourceCraft code licensing does not grant redistribution rights to its rights-reserved content.

## 11. HCM Fusion specifics

- Preserve stable lesson, concept, evidence, assessment and export identifiers.
- Correct stale lesson/coverage counts from the content registry.
- Correct contradictory “seven steps” and export-diagram counts.
- Do not expose assessment answers, scoring keys or rationale before authorised submission.
- Resolve the `/evidence/` robots conflict with the owner.
- Do not add currently unsitemapped evidence/assessment/export routes to a sitemap until indexing is approved.
- Keep Oracle independence, copyright and release-applicability disclaimers attached to relevant content.
- Public reading HTML should be cacheable according to an explicit policy; private/progress responses remain non-cacheable.

## 12. LearnPMO and ProcureSherpa specifics

- LearnPMO unknown routes return real 404s.
- Application/workspace query variants do not create indexable duplicates unless intentionally registered.
- ProcureSherpa's deterministic hash routes retain stable identifiers.
- Hash-route indexing is evaluated separately from the application shell.
- Local-first tools are not presented as server-authenticated applications.

## 13. Content and dates

Each content record carries:

- Provenance/source.
- Editorial status.
- Reviewed date.
- Substantive update date.
- Release applicability where relevant.
- Owner/approver.
- Claim references.

Do not use the build date as a substitute for a content update. Derived counts are computed from collections and checked in tests.

## 14. Internal linking

- Breadcrumbs on every indexable content page.
- Contextual related products, lessons, terms and solutions.
- Explicit Learn-to-portal handoffs:
  - ProcureSherpa → `sherpa-toolkit`.
  - LearnPMO → `learnpmo`.
  - HCM Fusion → `hcmfusion`.
  - SourceCraft → `sourcecraft`.
- Descriptive anchor text; no generic “click here”.
- Footer links support utility access but do not replace contextual links.
- Broken-link checks cover HTML, navigation, content collections, exports and generated sitemaps.

## 15. Images and media

- Approved local assets only.
- Explicit width/height or aspect-ratio to prevent layout shift.
- Responsive image sources where useful.
- Meaningful alt text; decorative images use empty alt.
- No text baked into an image when real HTML can carry it.
- No unverified screenshot or fabricated product capture.
- Lazy-load below-the-fold media; prioritise the genuine hero asset if one exists.
- Social cards are local and deterministic.

## 16. Rendering and performance

- Astro static-first public pages.
- Selective React islands for genuine interaction.
- Core content and metadata present in initial HTML.
- Route/origin-specific CSS is emitted inline; Astro-generated shared layout/component CSS remains external.
- No render-blocking third-party fonts or analytics.
- Self-hosted OFL fonts with subsetting and licence files.
- Target LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 at p75 when field data exists.
- Lighthouse performance ≥95 on representative static routes.
- Template-specific JS/CSS/font/HTML budgets.
- Investigate regressions rather than weakening budgets.

## 17. Analytics and privacy

- First-party minimal events only: registered CTA clicks, demo opens, form start/submission attempts, local exports and server-side lead/delivery/demo transitions.
- Browser events use an allowlisted `/api/events` schema, exact origin, a 2,000-byte cap and fixed dimensions; absent or policy-incompatible endpoint configuration means no browser requests. Loopback pages accept loopback endpoints only, and published pages accept non-loopback HTTPS endpoints only.
- No emails, messages, tokens, credentials, cookies, local-storage values, URLs, query strings, correlation IDs or free-text form contents in browser analytics/logs.
- Route/product/event IDs instead of personal context. Server lead events alone use a hashed correlation ID.
- Analytics failures never change navigation, exports, enquiry receipt or delivery behavior.
- Consent and retention statements match actual behavior and require owner approval.
- Search Console, production Analytics Engine and dashboard access are owner actions; unavailable data is `UNKNOWN`.

## 18. Submission and verification

Search Console property verification and sitemap submission remain owner actions. IndexNow may be submitted for hosts with a served key after an approved deploy, but it is not a substitute for canonical/indexability correctness and does not reach Google.

No local script may claim that a host is accepted, indexed or ranking without evidence from the relevant property.

## 19. SEO acceptance matrix

| Check | Required result |
|---|---|
| Baseline crawl | All 384 mappings resolve correctly or have approved one-hop redirects |
| Additional routes | Every route classified; only approved public-seo routes indexed |
| Status codes | Real 200/301/404 behavior; no soft 404s |
| Canonicals | Same-origin, self-referential and unique per indexable page |
| Titles/descriptions | Present, useful and non-duplicated |
| Social metadata | Approved local 1200×630 image on every indexable page |
| Headings | One H1 and logical order |
| Breadcrumbs | Match route registry |
| Internal links | Valid and contextual |
| Sitemaps | Same-origin, valid XML, public-seo only |
| Robots | Own sitemap named; no public-content conflict |
| Structured data | Registry-backed and factually supported |
| Dates | Verified substantive dates, full-history git dates, or omitted while history is unavailable; never uniform build dates |
| Redirects | Permanent, one-hop, loop-free |
| Assets | Approved, local, dimensioned and provenance-recorded |
| Rendering | Core content and metadata in initial HTML |
| Performance | Template budgets and Lighthouse target investigated/met |
| Privacy | No PII/secrets in analytics or logs |

The current generated summary covers 2,330 route records, 384 baseline mappings, 86 indexable pages and 1,246 governed content records. The social-card inventory covers 86 origin-aware cards and 130 governed asset records. Final local estate verification passed with 893 redirects and 869 HTML files. The responsive crawl passed all 86 routes across 344 viewport states with zero broken links, fragment failures, stylesheet failures or issue groups. The general browser suite passed 39/39 tests, including the current visual-system review, and all six origins met the unchanged Lighthouse performance threshold at 98–100. LCP ranged from 1,004.8ms to 2,026.7ms and CLS from 0 to 0.004510.

These are current local automated results, not proof of search-engine acceptance, indexing, rankings, content quality, deployed production behavior, field Core Web Vitals or measured INP. The local audit server intentionally serves uncompressed responses; gzip budget values are offline measurements rather than confirmed production compression. Search Console verification, sitemap submission, indexing decisions and field-performance validation remain owner actions.

## 20. Implementation ownership

- `packages/seo`: route/head/schema/sitemap/redirect logic.
- `packages/content`: provenance and editorial validation.
- `packages/catalog`: product, licence, solution and hub facts.
- `packages/brand`: approved assets and generated social-card sources.
- `apps/*`: origin configuration and route shells.
- `scripts/verify-estate.mjs`: baseline crawl and policy checks.
- `tests/e2e`: built-page metadata/status/internal-link assertions.

## 21. Evidence dependencies

Final indexing decisions require the owner for HCM evidence/assessment/export routes. Organization schema requires verified business identity. Some assets require provenance approval. Search Console and field data are unavailable until owner access is supplied.

These gaps are reported as blocked or `UNKNOWN`; they are not filled with plausible metadata.
