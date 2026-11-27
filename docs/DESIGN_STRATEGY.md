# Digi Tracks next-generation design strategy

**Status:** current source/design baseline

**Date:** 2026-11-27

**Scope:** six public Digi Tracks origins and their shared components

**Direction:** one recognizable publisher, six distinct instruments, registry-driven motion and explicit evidence boundaries

## 1. Design outcome

The estate combines typographic hierarchy, editorial composition, technical diagrams and selective motion. Each origin has its own palette, composition and visual character while sharing component contracts, type, focus behavior and responsive rules.

The Portal is the product-led front door. Learn is a learning-path surface; SourceCraft is a governed reference workspace; ProcureSherpa is a local-first decision tool; LearnPMO is a field-guide system; HCM Fusion is an evidence archive. They remain separate origins, not sections of one SPA.

The current visual system has a dedicated 33-case Playwright review across 11 representative routes and wide, laptop and mobile viewports, with full-page/viewport captures and manual inspection. Portal home uses a 1,888px shell at 1920px and 1,334px at 1366px; laptop body text is 17px, the smallest visible functional text measured 12.8px across all 33 cases, and the résumé sequence label rendered in loaded Instrument Serif italic at 19.2px. No case had horizontal overflow, an undersized functional-text sample or visible `MINDONE` branding. The final accessibility matrix passed 40 checks with zero axe violations, and the final Lighthouse matrix scored 98–100 across all six origins; INP remains unmeasured.

## 2. Non-negotiable constraints

1. Do not invent products, integrations, prices, customers, testimonials, certifications, ratings, outcomes or company identity.
2. Use only assets with recorded provenance and permission. MIND ONE Basic and MIND ONE Complete use neutral catalogue identifiers because no official edition marks were supplied.
3. Preserve internal IDs and URLs when public labels change. `mindone-pro` and `/products/mindone-pro/` remain stable for MIND ONE Complete.
4. Keep all MIND ONE access request-only and pre-launch. An enquiry does not issue access, billing, a demo grant or commercial entitlement.
5. Separate reviewed implementation from released entitlement, provider terms, quotas, deployment and launch policy.
6. Do not imply shared identity, SSO, deployment, schema or integration across the Vedik products. Campus Grid does not replace Vertex.
7. Keep Orion, Orion Hunter, Recon and OpsPilot visually and structurally distinct as four prime developer/security products.
8. Use Unify for the separate nine-app ERP. UNIFY is not an edition name.
9. Share components and contracts, never cookies, localStorage, IndexedDB, authentication, service-worker caches or runtime state across origins.
10. Preserve the 384 baseline sitemap mappings without treating reachability as indexing approval.
11. Treat WCAG 2.2 AA as an implementation and manual-review target. Automated checks are evidence, not a conformance claim.
12. Do not treat this work as authorization for production deployment, DNS changes or secret changes.

## 3. Brand system

### Typography

- **Host Grotesk Variable** — display, body and interface text, self-hosted under its OFL licence.
- **Instrument Serif** — italic editorial emphasis in selected display headlines and functional display labels, including MIND ONE résumé sequence labels, self-hosted under its OFL licence.
- **System monospace** — route labels, metadata, status codes and compact technical annotations.

Headlines use tight tracking and shorter leading than body text. Product names wrap rather than ellipsise. Prose uses a separate readable measure instead of inheriting the full shell width. Public edition names are **MIND ONE Basic** and **MIND ONE Complete**; lowercase internal identifiers remain unchanged.

### Shared shell

The desktop shell is `min(100% - 2rem, 120rem)`, with 2.5rem tablet and 1.5rem mobile gutters. Grid, split compositions, ledgers and index lists establish hierarchy before shadows or cards. Equal content edges remain aligned inside each composition. At narrow widths, heroes and product matrices stack intentionally without page-level horizontal scrolling. Laptop body text is at least 17px. Functional visible HTML text is at least 12.8px (`0.8rem` at the 16px root), including navigation, badges, buttons, status labels, code and table metadata; hidden, SVG, screen-reader-only and `aria-hidden` decorative text is excluded. Active stylesheet declarations enforce the same floor so labels do not inherit decorative sculpture scale.

### Identity and iconography

- The official mixed-case **Digi Tracks** lockup appears in the shared header and footer with intrinsic dimensions.
- Light and dark lockups are selected for the active origin and surface contrast.
- The official ICO is the favicon. Official 192px and 512px icons are declared by the SourceCraft and LearnPMO install manifests.
- The approved source set contains 40 owner-supplied assets: seven master identity/icon assets and 33 unique product marks.
- Two documented 320px lockup derivatives bring the approved identity inventory to 42 records.
- MIND ONE Basic and MIND ONE Complete have no supplied official marks and retain neutral identifiers.
- Phosphor icons provide interface and discipline iconography.
- ProductSignal renders catalogue-derived architecture views. These are original diagrams, not fabricated application screenshots or customer data.
- Sharp corners and one-pixel rules provide structure.

`inventories/source-assets.json` is the current identity inventory. `inventories/assets.json` is historical audit-time evidence, not the current approval list.

## 4. Origin systems

| Origin | Palette and environment | Composition and signature |
|---|---|---|
| Portal | Brighter cobalt/navy technical ground with coral, yellow and mint color fields, warm paper header, yellow footer, cream and paper bands | Product-led hero, three-tier product orbit, unified MIND ONE family block, portfolio and procurement narratives |
| Learn | Cobalt, yellow, coral, mint and cream | Offset learning paths, editorial modules and clear product-learning handoffs |
| SourceCraft | Paper, cobalt, yellow, coral and mint | Reference cards, searchable governed records and local study tools; real BATNA, Incoterms and TCO routes |
| ProcureSherpa | Forest, mint, orange and cream | Local-first workspace, route manifest, hash navigation and review notes |
| LearnPMO | Terracotta, mustard, sky and cream | Field-guide compositions, method grids and twelve authored public guides |
| HCM Fusion | Blush, oxblood, gold and cream | Evidence-led archive, gap register and release-applicability framing |

Header, footer and closing-section colors follow origin tokens in `base.css`. Lockup selection and contrast follow the same origin-aware contract. Focus and action colors also use origin tokens; a single cyan treatment is not imposed across all six origins.

Social cards use separate themes for Portal, Learn, SourceCraft, ProcureSherpa, LearnPMO and HCM Fusion. Install manifests use origin-specific background/theme colors. Neither social cards nor manifests imply shared origin state.

## 5. Portal homepage

### Narrative structure

The homepage leads with the product portfolio and one unified **MIND ONE family** block. Basic and Complete appear as two paths inside that block rather than as disconnected decorative sections. Awkward decorative section numbering is omitted; numerals remain where they carry real process or readout meaning.

Supporting sections cover Vedik and Nipuna, the Procurement ecosystem, the distinct developer/security products, industry solutions, the registry-derived product atlas, learning origins, services and the evidence/conversion close. Customer proof is omitted because none was supplied.

### Three-tier product orbit

The hero uses `EcosystemSculpture.tsx` and the real product registry:

- All 37 catalogue entries are assigned across three tiers.
- Each product is placed at regular angular intervals within its tier.
- Tiers have distinct vertical positions and a small angular offset.
- Official marks or neutral identifiers provide product context without becoming fabricated screenshots.
- The lazy Three.js island performs one 1.15-second assembly, then a 54-second turntable.
- Rendering is capped at 30fps and a 1.5-million-pixel budget.
- The loop pauses when the tab is hidden or the section is offscreen.
- Context loss is handled, and geometries, materials, listeners, observers and renderer resources are disposed on unmount.

WebGL initializes only for hover-capable fine-pointer sessions without a reduced-motion preference. Touch/mobile and reduced-motion sessions do not initialize WebGL. They retain a static **featured product-deck fallback**. The fallback does not contain all 37 products; the full catalogue remains available through the registry-driven product index.

### Product atlas and detail pages

The products page is an interactive catalogue rather than a flat list. Search, discipline filters, availability views, a desktop inspector and editorial records all consume the generated catalogue. Counts are derived from the registry, and empty states explain how to reset filters.

The current catalogue language is: **37 entries, 27 source products, 13 source flagships, 10 request-only routes, two pre-launch routes and 20 nested products.** The categories overlap. Entries are not all described as generally available products.

Product pages combine a display name, verified summary, deployment/platform facts, licence boundary, capability register, related products and an original product instrument. Capability glyphs follow semantic meaning rather than list position. The instrument visualizes real family/nested-product relationships; it does not simulate outcomes or application behavior.

Purpose-built compositions remain for the MIND ONE family, edition comparison, Procurement ecosystem, industry paths and Services. The comparison shows reviewed implementation separately from `UNKNOWN` commercial terms, quotas, integrations, provider terms, deployment and release timing.

## 6. Navigation and footer

Desktop and mobile Products navigation use the same grouped hierarchy. Primary groups cover the MIND ONE family, Vedik, Nipuna, Procurement, distinct developer/security products and the full catalogue. Mobile uses native disclosures and correct expanded state rather than flattening the portfolio.

The footer has four columns:

1. Brand and introduction.
2. Products.
3. Explore.
4. Learning.

Network links sit in the footer/legal row outside the four content columns. Footer colors, lockup contrast and closing-section treatment respond to the active origin.

The Network switcher lists Portal, Learn, SourceCraft, ProcureSherpa, LearnPMO and HCM Fusion. It does not imply shared login, shared progress or unified cookies.

## 7. Components and accessibility

Every component ships with markup, tokens, responsive rules, keyboard behavior, focus behavior, relevant empty/error states and reduced-motion behavior.

- Skip link and semantic landmarks on every page.
- One visible H1 per document.
- Visible focus indicators; no outline removal without an equivalent.
- Labels, hints and errors programmatically associated with form fields.
- Status changes use `aria-live="polite"` where appropriate.
- Decorative diagrams, product marks and the orbit are hidden from assistive technology where adjacent text supplies meaning.
- Controls are designed around a 44×44 CSS px target; this is a component target, not a blanket conformance claim.
- Disclosures use native keyboard-operable elements.
- Local tools expose saved/export/clear states without implying server synchronization.
- Unknown public routes return a real noindex 404, never an SPA shell.
- Reduced motion removes the orbit assembly, turntable, pointer response and decorative animation.

Automated checks do not establish WCAG conformance, screen-reader behavior, cognitive accessibility or real-device usability. Manual keyboard, zoom/reflow, reduced-motion and assistive-technology review remains required.

## 8. Motion

Motion is functional, brief and interruptible.

Allowed:

- One hero entrance per page.
- A 2px lift on linked cards.
- Button press feedback and underline drawing.
- Short state transitions for menus, disclosures, forms and local tools.
- The portal product orbit as the single continuous-motion exception.

Not allowed:

- Smooth-scroll libraries, scroll-jacking, custom cursors, magnetic buttons, carousels or timed tabs.
- Card movement driven by scroll.
- Perpetual decorative motion on reading surfaces.
- Motion that hides content, blocks input or covers text.
- More than one pointer effect on a page.

The orbit uses one animation-frame loop, caps pixel ratio at 1.5, pauses when hidden/offscreen and cancels on cleanup. Static content and navigation remain usable before WebGL loads or when WebGL is unavailable.

## 9. Assets, social cards and manifests

Social cards are original 1200×630 compositions using owner-supplied lockups, local fonts, verified labels and origin-specific geometric motifs. They are deterministic, generated locally and recorded with source/output hashes plus generator and route-registry hashes.

The current social-card inventory records 86 cards, 42 source assets and two font records: 130 governed asset records. This is separate from the 1,246 governed content records in the generated registry summary.

SourceCraft and LearnPMO install manifests use origin-specific theme/background colors and approved icons. Only SourceCraft registers a service worker, with an origin-bound cache namespace. No manifest or service worker is shared across origins.

Normal builds use local copied assets and require neither the reference repository nor ImageMagick. Asset regeneration is operator-only. No stock-photo filler, fabricated product screenshot or generated customer proof is used.

## 10. Stylesheet and performance contract

`base.css` holds shared shell/design-system rules, including origin tokens. Portal CSS is partitioned into common, home, flagship, procurement, industry, services, catalogue, product and contact families. Child CSS is partitioned by origin. `SiteLayout.astro` emits applicable route/origin CSS inline; Astro-generated shared/component CSS remains external. `global.css` and `origins.css` are unused historical files.

Implementation budgets remain:

| Resource | Budget |
|---|---:|
| HTML gzip equivalent | ≤100 KB |
| Initial JavaScript gzip equivalent | ≤75 KB, excluding explicitly deferred interaction/3D |
| Initial external CSS gzip equivalent | ≤60 KB |
| Self-hosted font transfer | ≤80 KB per template |
| Live WebGL contexts | ≤1 on the Portal home |
| Effect pixel ratio | ≤1.5 |

The current local build passes every transfer budget; Portal's maximum HTML is 38,099 B gzip. The local audit server intentionally serves uncompressed responses, so these gzip values are offline measurements rather than configured production compression. The final Lighthouse matrix scored 98–100, with LCP from 1,004.8ms to 2,026.7ms and CLS from 0 to 0.004510. Field targets remain LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 at p75 where field data exists; local simulated results do not prove field Core Web Vitals or measured INP.

## 11. Evidence and open dependencies

The final local build passes the responsive crawl of 86 routes across 344 viewport states and the general browser suite of 39 tests. Forty accessibility/browser-health checks recorded 968 axe passed rules, 36 incomplete checks and zero violations, with no page errors, console errors, failed requests or HTTP 400+ responses. The dedicated 33-case visual review found no horizontal overflow or undersized functional-text samples and confirmed that Host Grotesk and each used Instrument Serif face loaded. The six-origin Lighthouse matrix scored 98–100, with LCP from 1,004.8ms to 2,026.7ms and CLS from 0 to 0.004510; simulated local results do not measure INP or establish field Core Web Vitals. See [QA_REPORT.md](../QA_REPORT.md) for commands, limits and artifact locations.

Remaining owner and release dependencies include:

- Additional manual assistive-technology, zoom/reflow and real-device usability review of the six current origin systems.
- Approved official MIND ONE Basic/Complete marks.
- Authorised application source/data for ProcureSherpa, LearnPMO and HCM Fusion.
- Editorial permission for rights-reserved SourceCraft and HCM Fusion content.
- Approved real product captures where the owner wants application UI rather than architecture views.
- MIND ONE commercial entitlement, quotas, provider terms, billing, deployment and launch policy.
- Demo destinations, qualification policy and operator credentials.
- Resend/CRM/Turnstile configuration and real delivery evidence.
- Approved hosting, response compression, DNS, CI, deployment, monitoring, rollback and cutover.
- Search Console/analytics access, field-performance data and measured INP.

None of these gaps may be filled with plausible-looking demo content, customer proof or fictional product behavior.
