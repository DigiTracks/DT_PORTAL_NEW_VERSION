# Verified Product Intelligence

**Research date:** 2026-11-25 UTC

**Evidence current through:** approximately 19:26 UTC

**Accounts inspected:** [`chandrahotha`](https://github.com/chandrahotha) and [`DigiTracks`](https://github.com/DigiTracks)

**Method:** public GitHub API, public repository browsing, official product pages, and static inspection of public demos

**Restrictions observed:** no cloning, ZIP/repository downloads, repository modification, private-data access, commit, push, or product-code execution

This inventory is research provenance, not public website copy. Personal repository links must not be added to the portal interface. Public wording must use the evidence-bounded conclusions below.

## Evidence levels

| Level | Meaning |
|---|---|
| Code-backed | Present in public source or statically observable client code |
| Observable demo | Visible in a public demo; not proof of production parity |
| Vendor-stated | Published on an official product page; implementation not independently verified |
| UNKNOWN | No sufficient public evidence, contradictory evidence, or owner approval required |

## Executive decisions

1. **MIND ONE can be the primary flagship narrative, but it must remain request-only and pre-launch.** Public release, launch date, outcomes, and production readiness are not verified.
2. **MIND ONE Pro may be represented only as a request-only edition guidance page.** The official page calls it the complete variant, but the entitlement table is unapproved. No feature split, price, or launch date may be published.
3. **ProcureSherpa Learning is best represented as the learning component of Procure Sherpa, not a separate SKU.** No separate product, repository, edition, or commercial offering was verified.
4. **Procure Sherpa is a free browser-based learning and decision-support toolkit, not a procurement ERP.** Its copilot is local retrieval/matching, not a verified LLM. Custom workflows, team administration, native PDF generation, MCP, and accredited credentials are not supported.
5. **Vantor requires corrective copy before promotion.** Public repository evidence conflicts with the current site on licence, production readiness, and AI citations. The portal must not choose a side without owner resolution.
6. **Vertex and Vantor are distinct products.** No shared source, data model, or integration was verified.
7. **No public DigiTracks procurement MCP server was verified.** Internal typed tool registries in Vantor and ProcurementOS-Agent are not MCP implementations.
8. **Vedik has a code-backed static School ERP demo, but module counts conflict.** The repository says 18 modules while the live demo says 25. Other applications, production backend, mobile apps, offline behavior, and integrations remain unverified.
9. **Nipuna has detailed vendor-stated capabilities but no public implementation evidence.** Its matching is explicitly deterministic and rule-based, not generative AI.
10. **Construction and Transportation have no new first-party implementation evidence in this research.** Retain their existing pages without elevating or inventing claims.

## Repository shortlist

| Repository | Public description | Updated | Relevance |
|---|---|---|---|
| [`chandrahotha/chandrahotha`](https://github.com/chandrahotha/chandrahotha) | Live demos of procurement, ERP, Academy and code-intelligence products | 2026-11-09 | Cross-product demo index; MIND ONE listed as “Up Next” |
| [`chandrahotha/Vantor`](https://github.com/chandrahotha/Vantor) | Procurement operating system | 2026-11-03 | Primary Vantor implementation and limitation evidence |
| [`chandrahotha/ProcurementOS-Agent`](https://github.com/chandrahotha/ProcurementOS-Agent) | Standalone sourcing agent | 2026-11-12 | Related procurement automation; no MCP |
| [`chandrahotha/Procure-Sherpa_Portal`](https://github.com/chandrahotha/Procure-Sherpa_Portal) | Procurement curriculum, calculators, SOPs and checklists | 2026-10-01 | Academy/toolkit documentation |
| [`chandrahotha/Sherpa_ToolKit`](https://github.com/chandrahotha/Sherpa_ToolKit) | Public toolkit fork | 2026-09-26 | Secondary toolkit evidence |
| [`DigiTracks/Sherpa_ToolKit`](https://github.com/DigiTracks/Sherpa_ToolKit) | Upstream toolkit | 2026-09-26 | Older single-file toolkit, tests and PWA shell |
| [`DigiTracks/Vedik-Demo`](https://github.com/DigiTracks/Vedik-Demo) | Static School ERP demo | 2026-09-26 | Code-backed Vedik demo scope |

No public repository was found under either account for MIND ONE, MIND ONE Pro, Nipuna, Vertex, Procure5, Procura, or a procurement MCP server. `DigiTracks/Chronos-Demo` was not treated as evidence because it has no README or verified relationship to the requested portfolio.

## Product inventory

### MIND ONE

**Evidence:** vendor-stated plus profile README listing it as “Up Next.”

**Purpose:** AI interview-practice coach for candidates preparing for interviews, changing roles, practising competency questions, and communicating experience more clearly.

**Primary users:** interview candidates and career changers.

**Vendor-stated capabilities:**

- local résumé extraction and validation;
- thirteen résumé/job-description-grounded questions with rationales;
- browser speech input/output with typed fallback;
- answer-specific coaching, model-answer rewriting and optional numeric scoring;
- three prioritised debrief tips and a drill sheet;
- performance, competency and career-ladder readouts;
- local-only default with outbound requests blocked;
- optional hosted AI only after explicit, versioned, revocable consent;
- in-memory sessions, no account, no server-side profile and no telemetry.

**Integrations:** browser microphone and speech APIs are the only concrete integrations described. Hosted AI providers are unnamed.

**Relationships:** no verified integration with Nipuna or another recruiting product.

**UNKNOWN:** implementation, release readiness, provider list, real-microphone behavior, Hindi/Spanish speech, privacy approval, pricing, and outcomes.

**Safe public positioning:** “A pre-launch interview-practice product focused on résumé-grounded questions, answer-specific coaching and structured debrief. Request current access and scope.”

**Do not claim:** released availability, launch date, verified outcomes, ATS integration, MCP, or verified multilingual speech.

### MIND ONE Free and MIND ONE Pro

**Evidence:** vendor-stated edition names only.

| Dimension | MIND ONE Free | MIND ONE Pro | Evidence status |
|---|---|---|---|
| Positioning | Free entry edition | Complete variant | Vendor-stated |
| Public release | Not publicly released | Has not passed public-release approval | Vendor-stated |
| Capability entitlement | UNKNOWN | UNKNOWN | Entitlement table not approved |
| Price | UNKNOWN | UNKNOWN | Not published |
| Launch date | None published | None published | Official page states no launch date |
| Integrations | UNKNOWN by edition | UNKNOWN by edition | No edition-specific evidence |
| Deployment | Pre-launch details require confirmation | Pre-launch details require confirmation | Vendor-stated boundary |

**Safe public positioning:** “MIND ONE is planned with Free and Pro variants. Pro is described as the complete edition, but its approved entitlement table, price and release timing are not yet published.”

**Do not claim:** any specific Pro-only feature, quota, price, release date, or capability difference.

**Implementation consequence:** a MIND ONE Pro page can collect qualified interest and state the evidence boundary. It must not display a fabricated feature checklist or imply that access is available.

### Vedik

**Evidence:** vendor-stated product page plus code-backed static demo.

**Purpose:** offline-capable education ERP for education teams, schools, colleges and universities.

**Primary users:** school/college/university administrators, principals, teachers, education operations teams and students in the public demo.

**Vendor-stated platform variants:**

- School Management ERP;
- Social Community;
- Unnati;
- University Management.

The site also describes K-12, Colleges and Universities institution editions.

**Code-backed demo scope:** dashboard, students, teachers, attendance, classes, sections, subjects, timetable, exams, marks, homework, fees, finance, payroll, library, transport, hostel, inventory, communication, certificates, reports, staff, leave, settings, users/roles and licensing. The static demo uses mock data and browser-stored persona state. It includes printable receipts, certificates, ID cards and payslips; the live demo advertises CSV/Excel exports.

**Material conflict:** the public repository README describes 18 modules while the live demo says 25 modules live. Demo pricing plans are not approved public pricing.

**Integrations:** no public API, mobile source, third-party integration, AI or MCP implementation was verified.

**Roadmap:** multi-campus central governance and PhD dissertation/research-publication tracking are vendor-stated roadmap items.

**UNKNOWN:** production backend, the other three applications, offline behavior, mobile apps, integrations and current module count.

**Safe public positioning:** “Vedik is an education-platform family. Its public School ERP demo shows role-based school operations with sample data; production deployment and the wider application family require evaluation.”

**Do not claim:** all four applications are code-backed, a settled module count, production-ready offline/mobile behavior, approved public pricing, or unverified integrations.

### Nipuna

**Evidence:** vendor-stated only.

**Purpose:** offline recruiting, résumé intelligence and candidate-pipeline software.

**Primary users:** HR and hiring teams.

**Vendor-stated capabilities:**

- automatic job-description generation;
- local résumé parsing and OCR for PDF, DOCX and scanned images;
- department-aware, rule-based skill/experience matching;
- four-tier candidate-fit scoring;
- requisition-stage pipeline and ranked recommendations;
- automated skill-gap questionnaires through email/token links;
- token-gated candidate-response portal;
- four-role RBAC;
- local desktop operation without databases, containers or external cloud services.

**Critical distinction:** matching is explicitly deterministic and rule-based, not LLM-based.

**Integrations:** email/token-link questionnaires are the only concrete integration described. No ATS, ERP, public API, AI-provider or MCP implementation was verified.

**UNKNOWN:** implementation, OCR accuracy, security controls, reporting, data model, web scope and production readiness.

**Safe public positioning:** “Nipuna is a local-first recruiting toolkit for résumé intake, deterministic candidate matching and hiring pipelines. Request a deployment assessment.”

**Do not claim:** generative AI, verified ATS integration, MCP, measured accuracy, or independently proven production readiness.

### Vertex

**Evidence:** vendor-stated production description plus observable fictional showcase demo.

**Purpose:** self-contained project and procurement-management platform.

**Primary users:** procurement, commercial, project and capital-programme teams requiring local data control.

**Observable demo scope:** requisitions, sealed two-envelope RFQs, purchase orders, receipts/GRN, suppliers, contracts, claims, termination simulation, projects, reports, invoices, finance gates, exceptions, users/roles, licensing, audit log and compliance. The demo is explicitly labelled “Showcase demo · fictional data.”

**Vendor-stated production capabilities:** Windows installer, local/offline operation, contract-gated POs, server-side finance approvals, automated three-way matching, WBS budget tracking, risk registers, immutable lineage, segregation-of-duties gates and exact-money integer minor-unit calculations.

**Vendor-stated editions:** Starter, Professional and Enterprise. Detailed entitlements remain unverified.

**Integrations:** no external integration, AI or MCP implementation was verified. Multi-currency is visible in the demo; production exchange-rate synchronization is roadmap.

**Relationship to Vantor:** distinct products; no shared source, data model or integration verified.

**UNKNOWN:** production implementation, backend, reporting depth, integration surface, edition entitlements and readiness.

**Safe public positioning:** “Vertex is a self-contained project and procurement platform. Its public showcase demonstrates requisition-to-invoice and sealed RFQ workflows using fictional data; request a production evaluation.”

**Do not claim:** the demo proves production parity, live integrations, AI, MCP, or verified edition entitlements.

### Vantor

**Evidence:** code-backed public repository, with material conflicts against the official product page.

**Purpose:** self-hostable procurement operating system.

**Primary users:** procurement, finance, legal, audit, supplier and administrative roles.

**Code-backed capabilities:**

- supplier records, qualification/onboarding, risk scorecards and performance;
- RFQ → quote → award, comparison and allocation optimisation;
- contracts, obligations, renewal windows, e-signature handover and multi-dimensional matching;
- requisition → PO → receipt → invoice, tiered approvals, budgets, segregation of duties and three-way match;
- spend, should-cost and price intelligence;
- document upload, validation, storage, extraction, chunking and search;
- AI copilot with typed tools, role checks, human approval gates and negotiation simulation;
- hash-chained audit log, RBAC, tenant isolation and local/OIDC authentication;
- integration-adapter interface and HMAC-signed webhooks.

**Internal product mapping:** ProcurementOS Agent, RFQLens, CostPilot, ContractGuard, SupplierRadar, Strategic Sourcing Optimization, Procurement Spend Intelligence, Supplier Onboarding & Qualification, PO Price Intelligence and AI Supplier Negotiation Simulator.

**Deployment:** single-container SQLite for single-operator/local use, or Postgres/Redis/worker/Keycloak for multi-tenant deployment.

**Integrations:** Keycloak OIDC, Postgres/pgvector, Redis/RQ, S3-compatible storage, documented AI-provider options including Ollama and hosted providers, an adapter interface and signed webhooks. Only one reference adapter is documented; no named production ERP connector should be claimed.

**MCP:** no MCP server, transport or Model Context Protocol implementation was found. The typed tool registry is an internal AI-action surface, not MCP.

**Code-backed limitations:**

- explicitly not production-hardened; no SLA/on-call/upgrade path;
- no document OCR;
- lexical/keyword search by default; vector storage does not prove semantic-search quality;
- notifications poll;
- worker webhook draining is single-tenant;
- no Android client;
- AI is partial; final response evidence references remain empty and real-LLM evaluation is pending;
- repository documentation says nothing in the portfolio is production-ready.

**Material conflicts:**

| Claim | Official page | Public repository | Portal disposition |
|---|---|---|---|
| Licence | GNU AGPL v3 or later | Apache-2.0 | UNKNOWN until owner reconciles |
| Status | Ready to Deploy | Not production-hardened; nothing production-ready | Do not claim production readiness |
| AI citations | Every answer cited | Evidence references empty; evaluation pending | Do not claim complete citations |

**Safe public positioning:** “Vantor’s public repository contains a self-hostable procurement operating system spanning suppliers, sourcing, contracts, purchasing, spend and approval workflows. Production hardening and licensing require confirmation.”

**Do not claim:** definitive licence, production readiness, OCR, fully semantic search, complete AI citations, named production ERP connectors, Android client, or MCP.

### Procure Sherpa and ProcureSherpa Learning

**Evidence:** official product page, public documentation, older toolkit source and static inspection of the current live client.

**Purpose:** free browser-based procurement learning and decision support.

**Primary users:** procurement, sourcing and supply-chain professionals.

**Critical boundary:** it is not an ERP and does not process purchase orders.

**Current live client registration counts observed on 2026-11-25:**

- 19 calculators;
- 94 Academy function records across 32 module labels;
- 29 SOP registrations;
- 34 checklist registrations;
- 35 template registrations;
- 16 decision guides;
- 11 scenarios;
- 31 KPI registrations;
- 89 glossary terms;
- 148 knowledge records.

These are static registration counts, not a usability or correctness audit. Public copy should avoid fixed totals because repository, product-page and live-build counts differ.

**Implemented behavior observed in client code:**

- browser localStorage with in-memory fallback;
- JSON backup/restore;
- Academy progress, quizzes, exams, badges, learning paths and skill portfolio;
- organisation/department, currency, tax, display/date/theme/language and calculation settings;
- spend/KPI views and saved calculations;
- Document Pack Builder that generates HTML and opens the browser print dialogue;
- local Procurement Copilot that tokenises/stems queries, retrieves bundled records, returns linked citations and shows a confidence indicator.

**AI clarification:** the copilot is local retrieval/matching, not an LLM. No external AI-provider call was found in the inspected client.

**MCP:** no implementation or reference found.

**Reporting:** browser print/save-as-PDF, not native PDF generation.

**Customization:** configurable user settings exist. Custom branding, workflow designer, organisation-specific rule engine and team-administration console were not verified.

**Certificates:** the product page advertises “verifiable certificates,” but the live application says certificate/transcript generation is disabled and results are local, not accredited and not third-party verifiable. Do not claim certification or credentials.

**Offline:** the older toolkit has a service worker; the current live build has no service-worker or CacheStorage registration and loads separate content. No-backend/no-outbound-application-calls is supported; current offline reopening and “single-file” claims are not.

**ProcureSherpa Learning:** no separate product, repository, edition or SKU was found. Treat it as the Academy/learning component unless the owner confirms a distinct offering.

**Safe public positioning:** “Procure Sherpa is a free browser-based procurement learning and decision-support toolkit with calculators, SOPs, checklists, templates, local progress and a local knowledge-search copilot.”

**Do not claim:** procurement ERP behavior, accredited/verifiable credentials, native PDF generation, custom branding/workflows, team collaboration, generative AI, MCP, or a verified current offline PWA.

### Procurement MCP server

**Result:** UNKNOWN; no public first-party implementation verified.

- No MCP-named public repository under either account.
- No “Model Context Protocol” code-search hits under either account.
- Raw `MCP` substring hits were accidental package-lock hash sequences.
- Vantor and ProcurementOS-Agent use internal closed tool registries, not MCP transport.
- Official Procure5, Procura, Vantor and Procure Sherpa pages contain no MCP claim.

A private or planned DigiTracks MCP server cannot be ruled in or out. Do not claim one exists.

### ProcurementOS-Agent

**Evidence:** code-backed public repository.

**Purpose:** standalone autonomous sourcing-mission agent.

**Primary users:** procurement managers, buyers, finance reviewers, compliance reviewers and administrators.

**Capabilities:** PDF/text/spreadsheet ingestion with quarantine checks; deterministic sourcing comparison, TCO, supplier intelligence, risk and scenario optimisation; evidence spans, versioned plans and state-machine gates; negotiation drafts and human approval lanes; dry-run/execute actions with idempotency; CSV/XLSX/PDF exports; hash-chained audit; web application, HTTP API, async worker, OIDC/session authentication and S3-compatible storage.

**MCP:** none. Its 14-tool registry is an internal closed action surface.

**Relationship to Vantor:** Vantor names ProcurementOS Agent as an internal product, while the standalone repository requires zero runtime/build coupling to sibling products. Describe them as related implementations, not a shared running system.

**Public website disposition:** retain as supporting procurement intelligence unless the owner approves a dedicated catalogue entry. Do not add it to primary navigation merely because a public repository exists.

### Procure5

**Evidence:** vendor-stated only.

**Purpose:** self-hosted procurement-integrity suite containing ProcureLeak, TenderGuard, ContractLeak, ProcureDecision and ProcureOutcomes.

**UNKNOWN:** public implementation, edition detail, AI/MCP support and reporting specification.

**Safe public positioning:** retain the existing integrity-suite narrative with site-stated status and request-led evaluation. Do not add AI or MCP claims.

### Procura

**Evidence:** vendor-stated only.

**Purpose:** source-to-pay procurement module of Unify for supply-chain teams.

**Vendor-stated capabilities:** requisitions/approvals, RFQs and quote comparison, POs/amendments, goods receipt/three-way match, supplier scorecards and spend/savings analytics. It claims native Logistra integration and a shared supplier master with inventory/finance.

**UNKNOWN:** public source, production readiness, AI/MCP implementation and independent readiness evidence.

**Safe public positioning:** retain as a Unify module with site-stated capabilities; do not describe the claimed Logistra integration as independently verified.

### Construction and Transportation

No new public first-party implementation evidence was identified. Retain the existing pages and URLs, reduce their homepage prominence, and avoid adding new technical, outcome or integration claims.

## Approved content implications

### Homepage hierarchy

1. Product-led DigiTracks positioning.
2. MIND ONE flagship, explicitly request-only/pre-launch.
3. MIND ONE Free/Pro edition guidance with entitlement unknowns.
4. Vedik and Nipuna as distinct education and recruiting platforms.
5. Procurement ecosystem containing Vertex, Vantor, Procure Sherpa and ProcureSherpa Learning.
6. Industry-specific solutions.
7. Enterprise technology capabilities.
8. Specialised implementations/services.
9. Conversion close.

### Navigation

- Products → MIND ONE → MIND ONE Pro → Vedik → Nipuna → Procurement.
- Procurement → Vertex → Vantor → Procure Sherpa → ProcureSherpa Learning.
- Construction and Transportation remain in the catalogue and relevant industry paths, not the primary product menu.

### Required corrections to existing claims

- Remove Vantor “Ready to Deploy,” definitive AGPL and complete AI-citation claims until reconciled.
- Remove Procure Sherpa “verifiable certificates,” native-PDF, offline-PWA and fixed-count claims.
- Keep Nipuna matching explicitly deterministic/rule-based.
- Keep Vertex demo evidence labelled fictional/showcase-only.
- Keep Vedik module totals out of public copy until reconciled.
- Keep MIND ONE Pro entitlements, price and release timing `UNKNOWN`.
- Do not mention a DigiTracks procurement MCP server as an implemented capability.

## Source register

### MIND ONE

- [Official MIND ONE page](https://digitracks.net/products/mindone), accessed 2026-11-25; sitemap `lastmod` 2026-11-16.
- [Profile README at `2be5ec964873f51e27f487ebe377487ee497115f`](https://github.com/chandrahotha/chandrahotha/blob/2be5ec964873f51e27f487ebe377487ee497115f/README.md).

### Vedik

- [Official Vedik page](https://digitracks.net/products/vedik), accessed 2026-11-25; sitemap `lastmod` 2026-11-16.
- [Vedik demo README at `eafaa5b881d2461ba41908d122b469b0fcbc3786`](https://github.com/DigiTracks/Vedik-Demo/blob/eafaa5b881d2461ba41908d122b469b0fcbc3786/README.md).
- [Vedik route, plan and module definitions at the same commit](https://github.com/DigiTracks/Vedik-Demo/blob/eafaa5b881d2461ba41908d122b469b0fcbc3786/src/lib/site.ts).
- [Vedik public demo](https://vedik-demo.netlify.app/), accessed 2026-11-25.

### Nipuna

- [Official Nipuna page](https://digitracks.net/products/nipuna), accessed 2026-11-25; sitemap `lastmod` 2026-11-16.

### Vertex

- [Official Vertex page](https://digitracks.net/products/vertex), accessed 2026-11-25; sitemap `lastmod` 2026-11-16.
- [Vertex public showcase](https://vertexdemo.vercel.app/), accessed 2026-11-25.
- [Profile README at `2be5ec964873f51e27f487ebe377487ee497115f`](https://github.com/chandrahotha/chandrahotha/blob/2be5ec964873f51e27f487ebe377487ee497115f/README.md).

### Vantor

- [README at `e801781dda983b327c782f26a2e44adbe535ba1a`](https://github.com/chandrahotha/Vantor/blob/e801781dda983b327c782f26a2e44adbe535ba1a/README.md).
- [Repository head `92955f483cb3ae5cfc0f2ea5450aa7d1cab716b4`](https://github.com/chandrahotha/Vantor/tree/92955f483cb3ae5cfc0f2ea5450aa7d1cab716b4).
- [Portfolio at `9e3890a9e741cb94d1b248cbb50124ba6e32e081`](https://github.com/chandrahotha/Vantor/blob/9e3890a9e741cb94d1b248cbb50124ba6e32e081/docs/01-product/portfolio.md).
- [Requirements at `2b36d1d4bead360a09616084d3295decf20188e5`](https://github.com/chandrahotha/Vantor/blob/2b36d1d4bead360a09616084d3295decf20188e5/docs/01-product/requirements.md).
- [Roadmap at `89acba7000d6f648400d03bd79ae526168bf6d94`](https://github.com/chandrahotha/Vantor/blob/89acba7000d6f648400d03bd79ae526168bf6d94/docs/00-plan/ROADMAP.md).
- [Apache-2.0 licence at `306fa472025c85f01a225fae58476c5578555134`](https://github.com/chandrahotha/Vantor/blob/306fa472025c85f01a225fae58476c5578555134/LICENSE).
- [Official Vantor page](https://digitracks.net/products/vantor), accessed 2026-11-25; sitemap `lastmod` 2026-11-16.

### Procure Sherpa

- [Official Procure Sherpa page](https://digitracks.net/products/sherpa-toolkit), accessed 2026-11-25; sitemap `lastmod` 2026-11-16.
- [Current live application](https://procuresherpa.digitracks.net/) and [content bundle](https://procuresherpa.digitracks.net/content.js), accessed 2026-11-25.
- [Portal README at `66b514ff8bb587be1138a7cc5cbf9b5494877f8a`](https://github.com/chandrahotha/Procure-Sherpa_Portal/blob/66b514ff8bb587be1138a7cc5cbf9b5494877f8a/README.md).
- [FAQ at `b9d125a5db805069f9af5b2fb513d6e1b3901de8`](https://github.com/chandrahotha/Procure-Sherpa_Portal/blob/b9d125a5db805069f9af5b2fb513d6e1b3901de8/docs/faq.md).
- [Toolkit README at `1913f6c118932b037909127717b6e084d0929907`](https://github.com/DigiTracks/Sherpa_ToolKit/blob/1913f6c118932b037909127717b6e084d0929907/README.md).
- [Toolkit implementation at `d176d7a007bd92b72b7dce1418967721a9a6ed06`](https://github.com/DigiTracks/Sherpa_ToolKit/blob/d176d7a007bd92b72b7dce1418967721a9a6ed06/index.html).

### ProcurementOS-Agent

- [README/API contract at `e1652582c80db74c7a4cb26ccdf316da2c5c7a65`](https://github.com/chandrahotha/ProcurementOS-Agent/blob/e1652582c80db74c7a4cb26ccdf316da2c5c7a65/README.md).
- [Standalone ADR at `451c0aab4c586962108fb4e9fad7c7ad029c6ac9`](https://github.com/chandrahotha/ProcurementOS-Agent/blob/451c0aab4c586962108fb4e9fad7c7ad029c6ac9/docs/adr/0001-standalone-no-sibling-coupling.md).
- [Tool registry at `8412dc019b1652f0b43a953c947b8c7a6b184e2a`](https://github.com/chandrahotha/ProcurementOS-Agent/blob/8412dc019b1652f0b43a953c947b8c7a6b184e2a/app/tools/registry.py).

### Procure5 and Procura

- [Official Procure5 page](https://digitracks.net/products/procure5), accessed 2026-11-25; sitemap `lastmod` 2026-11-16.
- [Official Procura page](https://digitracks.net/products/unify/procura), accessed 2026-11-25; sitemap `lastmod` 2026-11-16.

## Research limitations

- Repository-reported test counts were not independently executed.
- Public demos do not prove production implementation or parity.
- No private repository, private document, credential or customer data was accessed.
- GitHub code search temporarily exhausted quota; core API access remained available and targeted searches completed.
- Product-page and repository conflicts remain unresolved until the owner supplies authoritative evidence.
