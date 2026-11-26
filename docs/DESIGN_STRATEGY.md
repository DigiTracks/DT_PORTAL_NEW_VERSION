# Digi Tracks next-generation design strategy

**Status:** implemented design baseline

**Date:** 2026-11-26

**Scope:** six public Digi Tracks origins and their shared components

**Direction:** high-end editorial futurism × immersive 3D × experimental digital design

## 1. Design outcome

The estate is one publisher with deliberately different instruments: a cinematic software studio at the top level, a warm learning journal, a procurement observatory, a local-first decision workspace, a set of PMO field guides and an evidence-led HCM archive.

Every screen combines:

- Typography-first hierarchy that works before animation or WebGL loads.
- Dark cinematic and light editorial environments used for different narrative roles.
- Asymmetrical compositions, strong rules, ledgers and deliberate empty space.
- Real catalogue, route, term, workflow and evidence structures instead of fabricated dashboards.
- One meaningful technical sculpture on the portal home, with a controlled 72-second turntable rather than decorative motion scattered across the estate.
- Clear boundaries between public explanation, gated product access and private application state.

The paper-like first implementation, the flat product list and the radial orbital homepage sculpture were rejected. The implemented portal now uses the owner-supplied identity, official product marks, catalogue-derived architecture views and a vertical systems engine.

## 2. Evidence and non-negotiable constraints

The existing portal and production website are read-only reference material. The replacement lives only in `/data/HomeWorks/digitracks-nextgen-portal`.

1. Do not invent products, integrations, prices, customers, testimonials, certifications, ratings, outcomes or company identity.
2. Use only assets with recorded provenance and permission. The supplied Digi Tracks lockups, icons and product marks are approved; MIND ONE retains a neutral generated identifier because no official mark was supplied.
3. Do not expose public full-play demo URLs. Full access is requested through a tracked journey and issued by an operator after qualification.
4. Do not imply that a lead reached an inbox or CRM until durable delivery has been tested.
5. Self-host fonts. Inter and external font stylesheets are not used.
6. Share components and contracts, never cookies, localStorage, IndexedDB, authentication, service-worker caches or runtime state across origins.
7. Treat WCAG 2.2 AA as an implementation and manual-review target. Automated checks are evidence, not a conformance claim.
8. Preserve all 384 baseline sitemap mappings initially. Rights-reserved routes remain reachable but are not automatically indexable.
9. No production deployment, DNS change or secret change is authorized by this work.

## 3. Brand system

### Palette

| Token | Value | Role |
|---|---|---|
| `--night` | `#090f17` | Cinematic ground, mastheads, technical instruments |
| `--night-raised` | `#101c29` | Raised dark surfaces and cores |
| `--paper-bright` | `#fcfbf8` | Editorial paper and inverse text |
| `--paper` | `#f4f2ed` | Warm reading ground |
| `--ink` | `#10202d` | Primary light-theme text |
| `--steel` | `#9aa2ab` | Muted inverse text and metadata |
| `--signal` | `#6ce5e8` | Restrained cyan signal, focus and active state |
| `--signal-deep` | `#06666a` | Accessible light-ground action colour |
| `--blue` | `#477bff` | Secondary technical signal, used sparingly |

No violet or lavender is used. Cyan is a signal, not a wash across every section. Near-black carries the cinematic environments; warm paper carries reading and evidence.

### Typography

- **Host Grotesk Variable** — display, body and interface text. `@fontsource-variable/host-grotesk@5.3.0`, OFL-1.1.
- **Instrument Serif** — italic editorial emphasis inside selected display headlines. `@fontsource/instrument-serif@5.3.0`, OFL-1.1.
- **System monospace** — route labels, metadata, status codes and compact technical annotations: `SFMono-Regular`, `Consolas`, `Liberation Mono`, `Menlo`, `monospace`.

Headlines use tight tracking and shorter leading than body text. The global portal H1 caps at 7.6rem; the product-catalogue hero caps at 9rem. Child-origin heroes use a tighter fluid scale. Product names wrap and are never ellipsised. Prose retains a separate readable measure instead of inheriting the full shell width.

The shared shell is `min(100% - 3rem, 112rem)`. At 1536px this produces a 1,488px content width with 24px side insets. The final MIND ONE correction replaces decorative résumé microtype with the body face at `0.82rem`, increases supporting flagship type and spacing, and measures a 110.592px H1 at 1536px. Visible product naming is **MIND ONE** and **MIND ONE Pro**; lowercase identifiers and URLs remain unchanged.

### Identity and iconography

- The official mixed-case **Digi Tracks** lockup is used in the shared header and footer, with explicit intrinsic dimensions and high fetch priority in the header.
- The official light lockup is used on dark grounds; the dark lockup is available for light grounds.
- The official ICO is the favicon. Official 192px and 512px icons are declared by the SourceCraft and LearnPMO install manifests.
- Thirty-three unique official WebP product marks cover the 35 source-defined products; some products intentionally reuse a family mark. MIND ONE and MIND ONE Pro have no supplied marks and use neutral catalogue identifiers, never presented as official logos.
- Phosphor icons provide interface and discipline iconography.
- ProductSignal renders catalogue-derived architecture views. These are original diagrams, not invented application screenshots or customer data.
- Sharp corners and one-pixel rules create structure before shadows or cards.

The earlier geometric diamond identity was removed. `inventories/source-assets.json` is the current approved identity inventory; `inventories/assets.json` remains the historical audit-time provenance inventory.

## 4. Portal art direction

### Homepage sequence

| Order | Section | Idea and visual |
|---:|---|---|
| 1 | Product-led hero + systems engine | “Complex work. Clear systems.” with MIND ONE in the lede and the lazy Three.js vertical systems engine |
| 2 | MIND ONE flagship | Request-only interview practice, published workflow and a product-bound access CTA |
| 3 | MIND ONE editions | Entry and planned complete positions, with the entitlement boundary stated rather than invented |
| 4 | Vedik + Nipuna | Paired education and local-first recruiting narratives with distinct audiences, instruments and CTAs |
| 5 | Procurement ecosystem | Vertex, Vantor, Procure5, Procure Sherpa and ProcureSherpa Learning in explicit operational roles |
| 6 | Industry-specific solutions | Challenges, workflows, product relationships and qualitative outcomes across six sectors |
| 7 | Product atlas + technology posture | Registry-derived catalogue, deployment boundaries and enterprise technology capabilities |
| 8 | Learning origins | Routes into Learn, SourceCraft, LearnPMO, HCM Fusion and ProcureSherpa Learning |
| 9 | Specialised implementations | Evaluation, implementation, migration and support kept secondary to products |
| 10 | Evidence + conversion close | What is known, what remains unverified and one focused conversation action |

### Systems engine

The rejected radial orbital web is replaced by **DT—01 / Systems Engine / Exploded Architecture**:

- Five chamfered metal operating layers stacked vertically with distinct dimensions, offsets, pitch, yaw and roll.
- A layered hexagonal processing core with luminous channels, glass cladding, retaining rings and support rods.
- Chamfered clear-coated metal plates with ceramic insets, fasteners, vents, edge seams and status modules.
- Vertical support rails, crossbars, side ports, top cap, base and feet.
- Six directed conduit ribbons that run primarily vertically rather than radiating from a centre.
- Official product marks positioned as contextual estate signals.
- A static isometric SVG fallback made from stacked plates, vertical conduits and technical labels.

The React island hydrates only when the media query matches desktop width, fine pointer, hover capability and no reduced-motion preference. It performs one 1.2-second assembly, then turns once every 72 seconds with a subtle additive pointer response. The renderer is lazy-loaded, capped at 30 frames per second and a 1.5-million-pixel budget, paused when hidden or offscreen, restored on context loss where possible and fully disposed on unmount. Mobile and reduced-motion sessions do not initialize WebGL and keep the static SVG.

### Product atlas

The products page is a dark, interactive catalogue rather than a flat list.

- Large “Find your next system.” headline.
- An original CSS catalogue dial built from real discipline counts.
- Search, six discipline filters and availability views.
- Live desktop product inspector with direct navigation.
- Editorial product records on narrow screens.
- Family/pre-launch/free-to-use counts derived from the catalogue.
- No-match and reset states.
- Demo CTAs use catalogue IDs and valid enquiry intents.
- Official product marks with empty alt text because the adjacent product name supplies the accessible name.

Verified catalogue language is **“35 source-defined products + two request-only MIND ONE edition routes.”** The 37 entries are not described as 37 generally available products.

### Product pages

Each product page combines a display headline, verified summary, deployment/platform facts, licence boundary, capability register, related products and an original product instrument. The instrument visualises the product’s real family and nested products; it does not simulate application screens or outcomes. Long unbroken names use a compact display treatment instead of clipping. Capability glyphs are selected from the capability text and held in consistent optical tiles; they are decorative semantic cues, not product screenshots.

Purpose-built compositions prevent the addendum pages from becoming copies of the generic product template:

- **Flagship:** MIND ONE and MIND ONE Pro use a résumé-to-debrief practice model, explicit pre-launch/request-only status and a neutral identifier until official marks are supplied.
- **Edition comparison:** published positioning and data posture are compared; unapproved features, price, quotas, integrations and release dates remain `UNKNOWN`.
- **Procurement ecosystem:** Vertex, Vantor, Procure5, Procure Sherpa and ProcureSherpa Learning are separated by operating role without implying a shared backend or verified connector.
- **Industry paths:** six authored sections connect challenges, workflow stages, applicable products and qualitative outcomes.
- **Services:** evaluation, implementation, migration and support are presented as scoped engagements, subordinate to the product portfolio.

## 5. Child-origin art direction

| Origin | Environment | Signature visual | Interaction contract |
|---|---|---|---|
| Learn | Warm editorial paper | Six-orbit learning-path diagram | Public guides; no enrolment, assessment or progress simulation |
| SourceCraft | Near-black procurement observatory | 122-term rights-aware dial | Search, region filter, favourites, recents and local export under a SourceCraft-only namespace |
| ProcureSherpa | Dark local-first workspace | Static Astro masthead plus React workspace island | Hash-route manifest, route search and local review notes; no application-parity claim |
| LearnPMO | Light field-guide system | Study plate and method grid | Twelve authored public guides; private/account routes return real 404s |
| HCM Fusion | Evidence monolith | Layered HCM/FUSION/EVIDENCE BOUNDARY object | Gap register and release method; protected content remains noindex and inaccessible |

Shared navigation, type, buttons, focus treatment and footer make the estate recognisable. Each origin keeps its own canonical, metadata, sitemap, robots declaration and storage namespace. SourceCraft and LearnPMO have install manifests; only SourceCraft registers a service worker. Any future manifest or service worker remains origin-bound.

## 6. Layout and composition

- CSS Grid is the primary layout tool.
- The shell is `min(100% - 3rem, 112rem)`; prose, lede and section-head measures are declared separately.
- Equal left and right content edges are preserved inside each composition.
- Asymmetry establishes hierarchy without making forms harder to scan.
- Repeated equal-card rows are avoided in favour of ledgers, index lists, split compositions and purposeful feature spreads.
- No deck ends in a visibly incomplete row without an intentional closing treatment.
- At desktop sizes, first sections are designed to fit the viewport within the recorded one-pixel tolerance where applicable.
- At 768 and 390, heroes stack intentionally and may exceed one viewport; page-level horizontal scrolling is never accepted.
- Long product names, empty states, errors and non-Latin input wrap without breaking the grid.

## 7. Motion

Motion is functional, brief and interruptible.

Allowed:

- One hero entrance per page.
- A 2px lift on linked cards.
- Button press feedback and underline drawing.
- Short state transitions for menus, disclosures, form status and local tools.
- One pointer-responsive Three.js sculpture on the portal home, with its approved slow turntable as the single continuous-motion exception.

Not allowed:

- Smooth-scroll libraries, scroll-jacking, custom cursors, magnetic buttons, carousels or timed tabs.
- Card movement driven by scroll.
- Perpetual decorative motion on reading surfaces.
- Motion that hides content, blocks input or covers text.
- More than one pointer effect on a page.

The sculpture animates transform and opacity, caps pixel ratio at 1.5, respects a 1.5-million-pixel budget, renders at no more than 30 frames per second and uses one animation-frame loop cancelled on cleanup. Hidden tabs and offscreen sections stop the loop. Reduced motion removes the turntable, assembly, decorative CSS animation and pointer response; mobile uses the SVG fallback.

## 8. Components and accessibility

Every component ships with markup, tokens, responsive rules, keyboard behavior, focus behavior, relevant empty/error states and reduced-motion behavior.

- Skip link and semantic landmarks on every page.
- One visible H1 per document.
- Visible focus indicators; no outline removal without an equivalent.
- Labels, hints and errors are programmatically associated with form fields.
- Status changes use `aria-live="polite"`.
- Decorative diagrams, official product marks and sculpture are hidden from assistive technology where adjacent text supplies the meaning.
- Interactive controls are designed around a 44×44 CSS px target and checked in the browser suites; this is not a blanket WCAG conformance claim.
- Estate disclosures use native keyboard-operable elements.
- Local tools expose saved/export/clear states without implying server synchronisation.
- Unknown public routes return a real noindex 404; no SPA fallback simulates application content.

## 9. Assets and social metadata

- The 40 approved owner-supplied identity assets comprise seven master identity/icon assets and 33 unique product marks.
- Two documented 320px lockup derivatives bring the approved identity inventory to 42 records and 87 copied files across six origins. Every copy and derivative is SHA-256 verified; the official ICO is the favicon.
- Normal builds use the local copies and require neither the old repository nor ImageMagick. Asset regeneration is operator-only.
- Social cards are original 1200×630 compositions using the official lockup, local fonts and verified labels.
- Every governed asset is recorded with source, destination, SHA-256, owner/licence and permitted use.
- No image, render, UI window or diagram receives a caption underneath it. Necessary credits belong in the footer.
- No stock-photo filler, fabricated product screenshot or generated customer proof is used.

## 10. Performance budgets

These are enforced implementation budgets, not field-performance claims:

| Resource | Marketing/reading template budget |
|---|---:|
| Initial compressed JavaScript | ≤75 KB excluding explicitly deferred interaction/3D |
| Initial compressed CSS | ≤60 KB |
| Self-hosted font transfer | ≤80 KB per template |
| Compressed HTML | ≤100 KB |
| Live WebGL contexts | ≤1 on the portal home |
| Effect pixel ratio | ≤1.5 |

Targets remain LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 at p75 where field data exists, with Lighthouse performance ≥95 on representative static routes. A missed budget is investigated rather than relaxed. The lazy Three.js chunk exceeds Vite’s default 500 kB warning threshold and is not part of the initial reading path.

### Stylesheet delivery

The final performance correction partitions CSS by responsibility. `base.css` holds shared shell/design-system rules; Portal families cover common, home, flagship, procurement, industry, services, catalogue, product and contact; child origins each have their own partition. The applicable route/origin CSS is emitted inline through `SiteLayout.astro`, so only the small common stylesheet remains an external render-blocking request. Exact duplicate shared rules were removed. Superseded `global.css` and `origins.css` are unused historical files and receive no further visual edits.

## 11. Verification evidence

Recorded identity, layout and final rebuilt checks cover:

- All six homepages return HTTP 200 with zero page/console/request errors.
- No horizontal overflow on the six homes at 1440 and 390, plus the portal at 1024 and 768.
- Desktop and mobile headers render the 320px lockup derivative at 170×28; 729×120 is the master asset dimension, not the displayed header size.
- Every rendered official product mark force-decodes successfully: 26 on the home, 37 on the catalogue and one on the Vertex detail at both tested widths.
- The portal initializes one WebGL canvas at 1440, 1024 and 768, and reaches the `ready` state.
- The portal initializes no canvas at 390 or under reduced motion; the static fallback remains visible.
- One H1 is present on every home.
- SourceCraft search, region filter, favourites, recents, export and storage isolation are covered by browser checks.
- ProcureSherpa hash navigation, route search, local notes and unknown-hash state are covered by browser checks.
- LearnPMO public-guide/private-route behavior is covered by browser checks.
- Rights-reserved HCM and SourceCraft routes return 200 with `noindex, follow`.
- Every origin serves a real noindex 404 under its own slash policy.
- Reduced motion suppresses decorative CSS animation.
- The final 86-route/344-state crawl found no broken links, fragment/CSS failures, overflow, page errors or console errors.
- Forty accessibility/browser-health checks recorded 964 passes, 30 incomplete manual-review items and zero violations.
- Rebuilt Lighthouse performance scored 98–100 across the six origins, with LCP 916.5–2,013.7ms and CLS 0–0.001346. INP remains unmeasured.
- Final MIND ONE captures at 1536px and 390px confirm the full-width shell, readable type, responsive composition and zero horizontal overflow.

Screenshots and measurements are stored in `artifacts/visual-identity/`, `artifacts/mindone-final-1536.png`, `artifacts/mindone-final-390.png` and `artifacts/full-route-qa.json`. Full accessibility, Lighthouse, budget, unit/API, build and end-to-end results are recorded in `QA_REPORT.md`; automated evidence does not prove WCAG conformance, field performance or search-engine acceptance.

## 12. Open evidence dependencies

The visual identity system is implemented. The following remain blocked until supplied or verified:

- Approved official MIND ONE/MIND ONE Pro marks; neutral identifiers remain until supplied.
- Authorised application source/data for ProcureSherpa, LearnPMO and HCM Fusion.
- Editorial permission for SourceCraft and HCM Fusion rights-reserved content.
- Product screenshots or captures only where the owner wants real application UI rather than the implemented architecture views.
- Demo destination inventory, qualification policy and operator credentials for the implemented signed-grant flow.
- CRM staging contract, Resend credentials and real inbox delivery.
- Turnstile keys and final privacy/retention wording.
- Search Console/analytics access and field-performance data.

None of these gaps may be filled with plausible-looking demo content, customer proof or fictional product behavior.
