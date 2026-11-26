# Digi Tracks information architecture

**Status:** implementation baseline

**Date:** 2026-11-26

**Scope:** six public origins, preserved deep links and newly classified application/utility routes

**Principle:** one network, distinct instruments, origin-bound state

## 1. Architecture outcome

A visitor should be able to answer four questions quickly:

1. What does Digi Tracks make?
2. Which product or learning path fits the work I need done?
3. What can I safely inspect without an account?
4. How do I request the right next step?

The estate uses a shared navigation and visual language, but each origin retains a clear job. The portal is the front door. Learning, study, procurement, project and people applications remain distinct destinations rather than being disguised as sections of one SPA.

## 2. Estate map

| Origin | Role | Preserved sitemap mappings | Currently indexable | Additional surface |
|---|---|---:|---:|---|
| `https://digitracks.net` | Product-led front door, flagship, procurement, solutions, industries, services and contact | 58 | 59 | MIND ONE Pro, edition comparison and Services added beyond the baseline |
| `https://learn.digitracks.net` | Learning hub and product-learning entry points | 6 | 6 | Learning application routes when authorised |
| `https://sourcecraft.digitracks.net` | Procurement/supply-chain term study and reference tools | 139 | 5 | Favourites, offline/PWA endpoints and public library JSON |
| `https://procuresherpa.digitracks.net` | Local-first procurement tool and deterministic content routes | 1 | 1 | Approximately 506 hash-routed detail routes plus application screens |
| `https://learnpmo.digitracks.net` | Project-management learning and workspaces | 12 | 12 | Approximately 30 application/workspace routes and query variants |
| `https://hcmfusion.digitracks.net` | HCM learning library, evidence, assessments and authorised application behavior | 168 | 3 | 467 additional registry paths: 462 public links, `/profile`, `/progress`, `/admin/`, `/robots.txt/` and `/sitemap.xml/` |
| **Total** | | **384** | **86** | |

`stats.digitracks.net` is non-indexable, was unavailable during research and is not a public replacement target.

The network preserves all **384 baseline sitemap mappings** as reachable URLs, but only **86 routes are currently indexable**. A preserved mapping is not an indexing commitment: a route must be `public-seo` and have `contentStatus: "approved"`. Rights-blocked and in-review content remains reachable with `noindex, follow`; it omits canonical, `og:url` and social images but retains basic social title, description, site-name and card-type metadata. Additional routes are classified before indexing; they are not automatically added to sitemaps.

## 3. Audiences and entry needs

| Audience | Likely entry | Primary need | Preferred next step |
|---|---|---|---|
| Operations/procurement leader | Portal, solution or industry page | Understand fit and scope | Request a solution review or product demo |
| Project/programme lead | Portal or LearnPMO | Find a relevant learning/workflow path | Start public/local content or request team access |
| People/HR leader | Portal or HCM Fusion | Find role-relevant learning and evidence | Explore approved library or request course access |
| Learner | Learn, Source Craft or product-learning page | Find the right material and continue work | Start/resume a real path or save study state locally |
| Developer/technical evaluator | Portal or developer-tool page | Verify licence, install/use model and boundaries | Inspect verified documentation or request access |
| Existing user | Product origin | Continue real work | Use the application task, not a marketing CTA |
| Partner/integrator | Portal contact | Discuss a scoped relationship | Submit a partnership enquiry |
| Support seeker | Product origin or contact | Resolve a specific issue | Submit support context safely |

These are navigation hypotheses, not claims about measured audience proportions.

## 4. Global navigation model

### Network header

- Digi Tracks identity and origin-bound return path.
- Current origin label where useful.
- Primary navigation relevant to the origin.
- **Network** switcher for the six public origins.
- One contextual request action.
- Native keyboard-operable desktop disclosures and a real mobile menu with expanded/collapsed state.

The Network switcher lists Portal, Learn, SourceCraft, ProcureSherpa, LearnPMO and HCM Fusion. It never implies shared login, shared progress or unified cookies. Website-facing “Estate” labels were removed; internal architecture names may retain the term.

### Portal primary navigation

- **Products** opens a grouped mega menu:
  - Flagship & core: MIND ONE, MIND ONE Pro, Vedik, Nipuna and the edition comparison.
  - Procurement: ecosystem, Vertex, Vantor, Procure5, Procure Sherpa and ProcureSherpa Learning.
  - Browse all products.
- Industries.
- Solutions.
- Services.
- **Resources** groups Learn, Source Craft, LearnPMO, HCM Fusion and ProcureSherpa Learning.
- About.
- Contact through the contextual request action.

Mobile navigation mirrors the same hierarchy with grouped labels rather than flattening every product into one long list. The six-column footer uses Products, Procurement, Company, Resources and Network groups. Navigation must not contain pipeline-only concepts CostPilot, VendorIQ, TalentMap or ComplyFlow.

### Contextual navigation

- Breadcrumbs on every indexable content page.
- Related products by verified relationship.
- Learning handoffs mapped explicitly:
  - ProcureSherpa → `sherpa-toolkit`.
  - LearnPMO → `learnpmo`.
  - HCM Fusion → `hcmfusion`.
  - Source Craft → `sourcecraft`.
- Utility links in the footer rather than competing with primary navigation.

## 5. Portal IA

The portal preserves all 58 baseline mappings and adds three approved indexable pages, for 59 indexable portal routes. Its catalogue contains **35 source-defined products plus two request-only MIND ONE edition routes**. MIND ONE and MIND ONE Pro are request-only, so the 37 catalogue entries are not 37 generally available products.

### Route groups

| Group | Purpose | Content model |
|---|---|---|
| Home | Lead with product-led positioning and the flagship portfolio hierarchy | Editorial sections plus registry-derived product index |
| Flagship products | Explain MIND ONE's audience, practice model, access boundary and evidence status | Dedicated flagship composition plus approved evidence |
| Edition guidance | Differentiate MIND ONE and MIND ONE Pro without inventing entitlements | Product registry, comparison contract and explicit unknowns |
| Procurement ecosystem | Explain Vertex, Vantor, Procure5, Procure Sherpa and ProcureSherpa Learning relationships | Procurement role registry and verified product boundaries |
| Nested products/modules | Explain a product-specific capability or module | Parent/child product relationship |
| Solutions | Connect verified products to industry challenges and workflows | Solution registry, workflow stages and related-product links |
| Industries | Explain relevance without inventing customer proof | Industry registry and verified product applicability |
| Capability hubs | Route between related developer/field tools | Hub registry and tool links |
| Services | Separate evaluation, implementation, migration and support engagements | Service content model and intent-specific CTAs |
| Learning | Introduce the learning network and product paths | Learning registry |
| Pricing/licensing | Explain buying models and quote-led scope | Licensing registry; no invented numeric prices |
| Trust/studio | Publish only verified identity, governance and proof | Claim/asset registers |
| Legal/utility | Privacy, terms, accessibility, contact and support | Approved policy content |
| 404 | Explain that the route does not exist and offer valid next steps | Static real 404 |

The exact baseline paths and approved addendum routes are generated from the audited inventories and committed to the route registry. Runtime routes, prerender routes, navigation, metadata, sitemaps and tests all consume that registry.

### Product-page order

1. Breadcrumb.
2. Product name and one-sentence category/audience statement.
3. Verified purpose and primary use case.
4. Registry-derived architecture view or approved product evidence; never a fabricated interface screenshot.
5. What the product does, expressed as workflows rather than inflated adjectives.
6. Buying/access model and deployment boundaries.
7. Integrations/dependencies only where verified.
8. Related learning path.
9. Related products or solution.
10. Request CTA and clear demo-access boundary.

A product page must not repeat the same screenshot in the hero and immediately below. If no approved capture exists, use registry-driven structure or a clearly non-fabricated technical diagram. MIND ONE, MIND ONE Pro, the edition comparison and Procurement ecosystem use dedicated compositions while preserving the same breadcrumb, metadata, CTA and evidence contracts.

## 6. Learning origin IA

Learn is the learning front door, not a duplicate product catalogue.

- Learning home.
- Product-learning entry pages for the verified product families.
- ProcureSherpa Learning as a distinct Academy/learning component with its own audience, workflow narrative and `learning` intent; it is not presented as an independently verified SKU.
- Role/task paths where real content exists.
- Clear handoff to the relevant product origin.
- Team-learning enquiry where appropriate.

Public syllabus, prerequisites, format and access boundaries should be visible before any account request. Certification or credential claims appear only when verified.

## 7. Source Craft IA

Preserve:

- Index and utility pages.
- 122 term routes.
- Nine regional packs.
- Search/filter.
- Compare.
- Flashcards.
- Recents.
- Favourites.
- Regional preferences.
- Print/share/export.
- Offline behavior and PWA update flow.

Fix:

- Preserve the working `/favourites/` saved-terms destination and its noindex policy.
- Slash/no-slash variants resolve to one canonical policy.
- Explore/Twitter metadata becomes specific.
- Manifest icon dimensions match the actual assets.
- Every term's editorial status is represented honestly; `in_review` is not presented as approved.

Content migration requires owner permission or original rewriting. Public crawlability is not redistribution permission.

## 8. ProcureSherpa IA

- Preserve the local-first hash-routed application shape initially.
- Preserve deterministic content-detail routes and exports.
- Separate public reading from private/local application state.
- Provide a route manifest so every valid hash route is known and unknown routes fail clearly.
- Request guided access rather than exposing a reusable public full-play link.
- Do not migrate URL shape until search/indexing evidence supports the change.

Assessment answers, scoring, scenario branches, progress schemas, authentication and tenant behavior require authorised source/data. Public pages alone cannot prove parity.

## 9. LearnPMO IA

- Preserve the 12 public routes.
- Keep an explicit application/workspace route manifest; unknown routes return a real 404 rather than an app shell with HTTP 200.
- The current build provides authored public guides. Saved plans, assessments, progress, local/demo mode, JSON backup/import and cloud sync are not implemented; they require authorised workspace source, schemas and rules.
- Any future saved work must remain origin-bound and migration-safe.
- Do not simulate progress, scoring or account behavior.

## 10. HCM Fusion IA

Preserve stable identifiers and relationships across:

- Nine sitemapped courses plus three valid unsitemapped courses observed during research.
- 47 lessons.
- 70 concepts.
- 26 glossary entries.
- 371 evidence claims.
- 47 assessments.
- Four certification papers.
- Three SOPs.
- Two scenarios.
- 27 exports.
- Application/utility routes.

Public reading, exports, assessments and authenticated progress are separate route classes. Assessment answers, scoring keys, rationales, misconception mappings, scenario branches and recall rules are not exposed before authorised submission.

Oracle copyright, independence and release-applicability statements remain attached to relevant content.

## 11. Route classification

Every route receives one class:

| Class | Indexing | State | Example |
|---|---|---|---|
| `public-seo` | Canonical and indexable | None or public | Product, term, lesson, solution |
| `public-utility` | Usually noindex or explicit policy | Public/local | Favourites, offline shell, export utility |
| `private` | Noindex | Authenticated or protected | Progress, notes, bookmarks, tutor |
| `administrative` | Noindex | Operator role | Delivery debug, access revocation |
| `retired` | Redirect or gone | None | Replaced route |

HCM's currently unsitemapped evidence/assessment/export routes are not added to a sitemap until the owner approves indexing policy. A public link does not automatically mean `public-seo`.

## 12. Route registry contract

Each route record contains:

- Stable route ID.
- Origin.
- Path/hash-route shape.
- Route class.
- Template.
- Content key.
- Title and description.
- Canonical policy.
- Indexability.
- Breadcrumb trail.
- Schema eligibility.
- Primary and contextual CTA IDs.
- Analytics route ID.
- Redirect history.
- Content provenance/status reference.

Manifest generation rejects duplicate routes, missing route fields and malformed or unsafe redirects. `pnpm verify` adds governed-asset, metadata, canonical, robots, sitemap, social-image, CSP, redirect and preservation checks. Link/claim coverage is limited to the implemented validators, and indexable-count drift is a warning rather than a build failure.

## 13. URL and redirect policy

- Preserve reachability for all 384 baseline sitemap mappings; generated sitemaps contain only approved, indexable routes.
- Choose one trailing-slash policy per origin.
- Redirect alternate forms permanently in one hop.
- Unknown public routes return a real 404.
- No redirect chains, loops or redirects to unrelated origins.
- Retain deliberate redirects for at least one year.
- ProcureSherpa hash routes remain stable initially.
- Do not use a catch-all SPA rewrite for public reading routes.

The redirect register is versioned and tested independently of page templates.

## 14. Search and discovery

- Portal product search filters the real product registry.
- Source Craft search/filter uses approved term content.
- HCM search uses approved course/lesson/concept/evidence identifiers.
- LearnPMO/ProcureSherpa search follows authorised application data.
- Search works with keyboard and screen readers.
- Empty results explain the query state and provide a reset action.
- Search never fabricates a result to avoid an empty state.

## 15. Forms and demo access in the IA

- Contact is a shared intent-driven journey, not separate inconsistent forms per page.
- Product/solution context is carried into the form.
- Full-play demos are gated behind request and qualification.
- Confirmation distinguishes durable receipt from delivery and access issuance.
- Operator/debug routes are administrative and never publicly indexed.

See `CONVERSION_STRATEGY.md` for the delivery and access model.

## 16. State boundaries

- Each origin owns its localStorage keys, IndexedDB databases and any implemented service-worker cache names or PWA manifest.
- Migrations are versioned and tested against prior-state fixtures.
- Corrupt state fails clearly; it is not silently reset.
- Source Craft favourites and recents use the origin-bound keys `digitracks:sourcecraft:favourites:v1` and `digitracks:sourcecraft:recent:v1`.
- ProcureSherpa remains local-first initially.
- SourceCraft has the only service worker; SourceCraft and LearnPMO have install manifests.
- LearnPMO workspace state and backup/import remain unimplemented pending authorised source and schemas.
- HCM authenticated progress remains separate from public reading and is not implemented in this public shell.
- No cookie, token or saved work is shared across origins.

## 17. Mobile IA

- Primary navigation collapses into a real menu with the same Products, Procurement and Resources hierarchy as desktop.
- Breadcrumbs wrap or simplify without hiding the current page.
- Product matrices become stacked key/value structures or contained horizontal scrollers.
- The Network switcher remains reachable without hover.
- Forms use one-column layouts and appropriate input types.
- Application navigation prioritises the current task.
- No product name is truncated.
- Touch targets meet the shared component contract.

## 18. Content governance

- Product facts come from the product/catalogue registry.
- Factual claims require source, verification date, owner and status.
- Content collections carry provenance, editorial status, reviewed date, substantive update date and release applicability.
- Derived counts are calculated from content, never carried by hand.
- Rights-reserved content is blocked until permission is recorded.
- Public content and authenticated application content use separate approval paths.

## 19. Navigation acceptance tests

- Every navigation item resolves to a valid route.
- Current page and origin are identifiable.
- Products, Procurement and Resources hierarchy is consistent on desktop and mobile.
- Network switcher works by keyboard and touch.
- Mobile menus close after navigation and expose correct expanded state.
- Breadcrumbs match the route registry.
- Related-content links are contextual and valid.
- No pipeline-only product appears.
- No public full-play demo URL appears in HTML, JavaScript, sitemaps or analytics.
- Unknown routes return a real 404.
- Every additional route has an explicit class and indexing decision.
- Every preserved deep link retains its destination or has a tested permanent redirect.

## 20. Evidence dependencies

The generated route registry is the routing source of truth; final labels and indexing decisions remain subject to owner approvals. Application parity requires authorised source/data. Rights-reserved Source Craft/HCM content requires permission. Signed demo grants are implemented, but production issuance still requires the owner's destination inventory, qualification policy and operator configuration.

Where evidence is absent, the implementation records the gap rather than guessing.
