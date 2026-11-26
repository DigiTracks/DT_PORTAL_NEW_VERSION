# Digi Tracks Estate Rebuild: Competitor Analysis

**Phase:** competitor research and implications for information architecture, proof, conversion, and content.

**Research/access date:** 2026-11-25.

**Scope:** eight public competitors/adjacent products; the six Digi Tracks functions named in the brief.

**Status:** research input, not a visual design specification or an implementation plan.

## 1. Executive readout

- The estate should not imitate one competitor. It needs a **shared trust and navigation system** with different conversion models for enterprise platforms, learning, developer tools, and vertical operations.
- **Odoo and ERPNext** show how to make broad product catalogues understandable through modules, industries, documentation, and deployment choices. Their scale is not a reason to reproduce their mega-menus.
- **Procurify** is the closest analogue for quote-led procurement: workflows first, interactive proof second, qualified demo/quote third. Its lack of public prices is appropriate only when the page explains cost drivers and the next step.
- **Oracle University** shows the value of role-based learning paths, free entry content, certification proof, and explicit system requirements. Its regional purchase flow and archived accessibility report are warnings about opacity and stale evidence.
- **Superset, Semgrep, Cliniko, and Fresha** demonstrate four useful adoption patterns: docs-led open source, time-to-first-value developer onboarding, self-serve vertical trial, and consumer/business journey separation.
- Accessibility conformance is **UNKNOWN for all eight in this pass**. Some publish useful signals; none of the marketing pages was subjected to a full manual assistive-technology audit here.

## 2. Method and evidence rules

- Sources are official product pages, official documentation, official trust/security pages, official repositories, and first-party app-store listings. No review-site score is used as independent proof.
- Static fetches were supplemented with rendered browser snapshots where pages were JavaScript-only. No account was created, form submitted, purchase made, or gated trust report opened.
- **Observed** means visible on a cited public page or explicitly stated in official documentation. **Interpretation** means the analyst's inference for Digi Tracks. **UNKNOWN** means not established by this research.
- Prices, customer counts, ratings, compliance badges, and outcome metrics are treated as publisher claims unless a scoped artefact was available. They are not repeated as independently verified facts.
- Pricing is region-sensitive. Odoo, ERPNext, Oracle, and Fresha rendered India-localized experiences; Cliniko showed a dollar sign without establishing the currency. Other regional variants are UNKNOWN.
- Compact browser checks used a 689 CSS-pixel viewport. They can reveal responsive metadata and gross overflow, but do not replace 390/320/768/1440 testing, real-device testing, keyboard testing, zoom, or screen-reader testing.
- SEO observations concern visible IA and content structure, not rankings, traffic, backlinks, or search performance. Those remain UNKNOWN.
- No long copy, screenshots, logos, proprietary images, or customer assets were copied into this document.

## 3. Competitor findings

### 3.1 Odoo — integrated business-app suite

**Observed**

- **Positioning/audience:** “all your business on one platform,” addressed to businesses from small companies to larger enterprises; app and industry paths coexist. (O1, O9)
- **IA/navigation:** Apps, Industries, Community, Pricing, and Help lead the top level. The app catalogue groups modules such as Finance, Sales, Supply Chain, HR, Marketing, and Services rather than presenting one flat list. (O1, O4)
- **Proof/trust:** company/community scale, partner network, open-source contribution paths, a security page, legal/privacy links, customer stories, tutorials, and a public forum. Scale figures are Odoo-published. (O7, O9, O6)
- **Pricing presentation:** One App Free, Standard, and Custom; paid plans are presented per user/month with annual/monthly controls and an app/user comparison calculator. The observed page was in INR. (O2)
- **Primary conversion:** Start a free trial or buy a plan; “Meet an advisor” branches by company size into demo or project assessment. (O1, O2)
- **Onboarding/demo:** the trial collects business/contact details and app interests, then uses SMS or WhatsApp verification before managed Odoo Online access. Advisor, live-chat, and demo routes reduce dependence on self-serve signup. (O3)
- **Content/SEO:** separate user, developer, administrator, and installation guides; tutorials/e-learning/certifications; app pages, blog, forum, releases, and localized documentation. (O4, O8)
- **Mobile/responsive:** an official mobile-documentation entry exists, but its body did not render fully in this pass. Current app feature parity and phone layout are UNKNOWN; responsive scripts were observed on the marketing site. (O5, O1)
- **Accessibility signals:** a skip-to-content link appears in documentation. No current marketing-site/product ACR was located. Third-party accessibility modules do not prove Odoo conformance. (O4)

**Interpretation**

- **Adopt:** dual app/industry discovery, role-separated documentation, and advisor routing based on buyer complexity.
- **Avoid:** a catalogue so large that the primary decision path disappears; presenting localized prices without a durable explanation of region, billing unit, and included services.
- **Digi Tracks relevance:** H1 should explain a small set of business outcomes before exposing the full module catalogue; H2/H6 can reuse app/industry facets without copying Odoo's breadth.

### 3.2 ERPNext — open-source ERP with managed hosting and partners

**Observed**

- **Positioning/audience:** a broad, customizable, open-source ERP for different industries and company sizes. `erpnext.com` redirected to a Frappe property, and the rendered experience geo-selected India. (E1)
- **IA/navigation:** Modules, Industry, Pricing, Customers, Partners, Blog, Services, Resources, and Comparisons. The home page combines selectable feature groups, industry paths, adjacent Frappe apps, marketplace apps, and partner proof. (E1)
- **Proof/trust:** public source repository, partner directory/tiers, customer stories, forum, documentation, security disclosure, and hosting/support material. Security/compliance statements remain vendor claims unless a scoped report is inspected. (E1, E5, E7, E8)
- **Pricing presentation:** software is free/open-source; cost is split into hosting and implementation. Managed plans use compute/resource pricing rather than per-user pricing. The India page showed site and server entry prices in INR, a 14-day trial, self-hosting, partner implementation, and enterprise contact. (E2, E3)
- **Primary conversion:** start a Frappe Cloud trial, self-host from source, choose a partner, or contact sales for enterprise guidance. (E2, E3)
- **Onboarding/demo:** Frappe Cloud describes choose app, choose plan, choose subdomain; documentation and Frappe School support self-implementation. Frappe states that implementation is delivered by partners rather than directly. (E2, E3, E4)
- **Content/SEO:** product/category blog, release pages, customer stories, comparisons, wiki documentation, forum, school, and source-linked installation. Docs expose page actions such as edit, copy as Markdown, and helpfulness feedback. (E4, E5, E6)
- **Mobile/responsive:** marketing/docs use responsive navigation and viewport metadata; no document overflow appeared at 689 px on the pricing page. Current official native-app availability and feature parity are UNKNOWN. (E1, E2, E4)
- **Accessibility signals:** docs expose a main landmark and an “Open navigation menu” control. The pricing DOM lacked a main landmark and skip link at compact width. No product ACR was located. (E2, E4)

**Interpretation**

- **Adopt:** a transparent total-cost explanation, deployment choice, partner/implementation path, and docs that are easy to reuse and improve.
- **Avoid:** making “open source” carry the whole trust argument; hosting, support, migration, security, and exit costs still need explicit scope. Dense cross-sells and attack-style comparison pages can dilute the core decision.
- **Digi Tracks relevance:** H1/H2 should separate licence, hosting, implementation, integrations, support, and data-exit costs inside the quote model.

### 3.3 Procurify — quote-led spend management

**Observed**

- **Positioning/audience:** growing mid-sized organizations, with procurement, finance, IT, and industry-specific paths. The current home page frames the product around intake-to-payment control. (P1, P2)
- **IA/navigation:** Platform, Solutions, Customers, Resources, Pricing, Login, and Book a demo. Features are organized into Intake-to-Approve, Purchase-to-Receive, and Invoice-to-Pay, plus roles, industries, and integrations. (P1, P2)
- **Proof/trust:** named customer stories, outcome metrics, testimonials, review badges, and security/compliance claims. Metrics and ratings are Procurify-published; underlying audits were not inspected. (P1, P6, P7)
- **Pricing presentation:** modular custom quote; cost drivers include products, add-ons, Pro versus Basic users, and integrations. No public dollar amounts appeared on the pricing page. (P3)
- **Primary conversion:** Book a demo or Request pricing. An interactive product tour is a lower-commitment alternative. (P1, P3, P4)
- **Onboarding/demo:** the demo form qualifies business email and routes to an expert; the page describes a guided implementation. A separate knowledge base has getting-started and role-based collections. (P4, P5)
- **Content/SEO:** workflow/role/industry/integration pages, stories, reports, guides, whitepapers, toolkit assets, and breadcrumbs. Some resources are gated or JavaScript-loaded. (P2, P6, P8)
- **Mobile/responsive:** iOS/Android app links are present; the marketing site had viewport metadata, a collapsed menu at compact width, and no document overflow at 689 px. Real 390 px behavior is UNKNOWN. (P1, P5)
- **Accessibility signals:** skip-to-content and a main landmark were observed. The tested `/accessibility/` URL returned 404; that does not prove no statement exists elsewhere. WCAG conformance is UNKNOWN. (P1)

**Interpretation**

- **Adopt:** workflow-led IA, modular cost drivers, self-service tour plus human demo, and separate requester/approver/admin learning paths.
- **Avoid:** hiding all price logic behind a form; broad AI/agent language that does not explain the operational workflow; unqualified ROI numbers.
- **Digi Tracks relevance:** this is the primary reference for H2 and the estate-wide quote journey, but Digi Tracks should publish more of the scoping logic than Procurify does.

### 3.4 Oracle University — enterprise learning and certification

**Observed**

- **Positioning/audience:** individuals, teams, and partners building Oracle/AI skills; official training, learning subscriptions, hands-on labs, and certifications. `education.oracle.com` redirected to Oracle's regional corporate education site. (U1, U2)
- **IA/navigation:** Training and Certification lead the local navigation; content branches by audience, product family, role, skill level, learning format, and community. Free Foundations is a prominent entry route. (U1, U2)
- **Proof/trust:** first-party curriculum, credential program, learner/community claims, enterprise testimonials, videos, and product-expert sessions. Recognition is Oracle's positioning, not independent verification in this pass. (U1, U2)
- **Pricing presentation:** subscription and exam-product cards plus Buy and Contact Sales. The India purchase page exposes no public amount on the product cards; price appears after product/quantity selection in an order webform, and the regional instructions describe bank-transfer ordering. (U3)
- **Primary conversion:** explore free training/MyLearn, buy a learning or exam subscription, or contact sales. (U1, U3)
- **Onboarding/demo:** public pages lead into MyLearn for paths, labs, progress, and live sessions. MyLearn rendered as a JavaScript shell in the static fetch, so unauthenticated catalogue detail is UNKNOWN. (U1, U4)
- **Content/SEO:** free foundation stories, product/role training hubs, certification pages, documentation/FAQs, blog/video, and community. FAQ documentation is task-oriented but explicitly requires JavaScript. (U1, U2, U6, U7)
- **Mobile/responsive:** the corporate education home has a responsive menu, skip link, main landmark, and no overflow at 689 px. MyLearn playback documentation states 1024×768 minimum resolution, JavaScript/cookies, supported desktop browsers, captions, and transcripts. Current native-app support is UNKNOWN. (U1, U6)
- **Accessibility signals:** an accessibility policy is linked. The located MyLearn ACR is VPAT 2.3, dated 2019 with report date 2022, applies only to version 2.4, and contains “Partially Supports” entries. It is useful historical evidence, not current-product conformance. (U5)

**Interpretation**

- **Adopt:** role/outcome paths, free sampler content, clear learning formats, documented playback requirements, captions/transcripts, and dated ACR transparency.
- **Avoid:** requiring an account before showing outcomes, syllabus, duration, prerequisites, and accessibility; regional price opacity; presenting an archived ACR as current proof.
- **Digi Tracks relevance:** H3/H4 should make sample learning and role mapping public, then quote team plans, cohorts, labs, and support only after scope is clear.

### 3.5 Apache Superset — open-source data exploration

**Observed**

- **Positioning/audience:** open-source data exploration/visualization for analysts, administrators, developers, and teams that operate their own deployment. (S1)
- **IA/navigation:** Users, Admins, Developers, and Community lead the site, each with its own guide and entry task. (S1)
- **Proof/trust:** Apache Software Foundation governance, Apache-2.0 licence, public source, release/issue workflows, security documentation, contributor roles, and community channels. Named users on the home page are project-published, not independently audited adoption. (S1, S4, S5, S6, S9)
- **Pricing presentation:** no commercial vendor pricing or sales CTA on the Apache project site. Commercial hosting is outside the project's own conversion path. (S1)
- **Primary conversion:** Get Started, quickstart, installation, source repository, or community participation rather than a quote. (S1, S2, S3)
- **Onboarding/demo:** Docker Compose quickstart for local trial; installation methods distinguish development, Kubernetes production, and hands-on PyPI. Production hardening and operator responsibilities are documented separately. (S2, S3, S4)
- **Content/SEO:** role-separated, versioned Docusaurus documentation; search; task tutorials; screenshots; API/developer material; database guides; contributing docs; and public GitHub issues/discussions. (S1, S2, S5, S9)
- **Mobile/responsive:** an optional, feature-flagged mobile mode is read-only and limited to dashboard consumption; authoring, SQL Lab, and administration are excluded. Without the flag, small screens receive the scaled desktop layout. (S7)
- **Accessibility signals:** skip link/main landmark and engineering guidance to use accessible selectors in tests. No product-level ACR was located; testing guidance is not conformance evidence. (S1, S8)

**Interpretation**

- **Adopt:** role-first docs, task-based quickstarts, explicit development/production separation, public security guidance, and an honest read-only mobile scope.
- **Avoid:** making essential mobile usability opt-in without clear defaults; treating documentation or open-source availability as proof of managed-service quality.
- **Digi Tracks relevance:** H5 should optimize for install → first useful result → trusted evaluation, with commercial support quoted separately.

### 3.6 Semgrep — developer-led application security

**Observed**

- **Positioning/audience:** developers, AppSec teams, and security leaders; the current hero emphasizes code security for builders and agents, with SAST, SCA, secrets, and related products. (M1, M3)
- **IA/navigation:** Products, Solutions, Resources, and Pricing; separate developer and security paths, docs, blog, registry, playground, customer stories, and sign-in. (M1, M3)
- **Proof/trust:** customer logos/testimonials, case studies, review claims, a SafeBase trust portal, security contacts, incident disclosures, and gated assurance documents. SOC 2/GDPR badges are vendor-published; reports were not opened. (M1, M5)
- **Pricing presentation:** Free Edition, Teams, and Enterprise. The observed page displayed Teams at $30/month per contributor, a free tier capped at 10 repositories/contributors, and custom Enterprise pricing. Currency region was not established. (M2)
- **Primary conversion:** Try for free/Sign up or Book a demo. (M1, M2)
- **Onboarding/demo:** quickstart supports GitHub/GitLab web signup, CLI install/authentication, `semgrep ci`, and a local `semgrep scan` alternative; docs explain what data is sent. Playground and rule registry support evaluation before procurement. (M4, M6)
- **Content/SEO:** searchable technical docs, installation/CLI guides, registry, playground, blog/research, product comparisons, and customer content. Several marketing pages are heavily JavaScript-rendered. (M1, M4, M7)
- **Mobile/responsive:** responsive navigation and no document overflow were observed at 689 px; no native mobile app was found. Dashboard/editor usability on phones is UNKNOWN. (M1)
- **Accessibility signals:** the compact DOM had no skip link or main landmark, and many image nodes lacked `alt` attributes. Those are audit signals, not a WCAG verdict. No current ACR/statement was located. (M1)

**Interpretation**

- **Adopt:** a working playground, copyable quickstart, transparent data-handling explanation, rules/content ecosystem, and separate developer versus buyer journeys.
- **Avoid:** AI-first/product-name proliferation that obscures the core job; badge-led trust without downloadable scope; a free tier whose limits are disconnected from the upgrade explanation.
- **Digi Tracks relevance:** H5 should pair marketing with executable evaluation and publish licence, data handling, support, and upgrade boundaries.

### 3.7 Cliniko — allied-health practice management

**Observed**

- **Positioning/audience:** allied-health professionals needing scheduling, clinical records, billing, and practice operations. (C1, C3)
- **IA/navigation:** Products, Solutions, Features, Pricing, Security, Connected apps, Help, Log in, and Get started. Industry/specialty and use-case paths are prominent. (C1, C3)
- **Proof/trust:** customer testimonials/stories, specialty/region tags, security/compliance claims, connected-app ecosystem, and help content. Reports behind security claims were not inspected. (C6, C7)
- **Pricing presentation:** practitioner-count tiers. The fetched page showed $45/month for one practitioner and $95/month for 2–5, with higher tiers and a 30-day trial CTA. The dollar currency and other regional prices are UNKNOWN. (C2)
- **Primary conversion:** Get started/30-day free trial; explore features is the lower-commitment alternative. (C1, C2)
- **Onboarding/demo:** account creation asks for business name, email, password, and location; no credit card is required for the trial. Full functionality requires JavaScript. (C4)
- **Content/SEO:** specialty/solution pages, feature pages, practice tips/news/events, reviews, connected apps, and a searchable help centre. (C3, C7, C8)
- **Mobile/responsive:** official guidance uses mobile browsers rather than native apps, with home-screen shortcuts; iPhone/iPad guidance specifies Safari for saving the shortcut. Responsive CSS is used. (C5, C3)
- **Accessibility signals:** decorative ARIA handling was observed in fetched HTML. No accessibility statement/ACR was located, and runtime behavior could not be reliably assessed in this pass. (C1)

**Interpretation**

- **Adopt:** buyer-language specialties, practitioner/location-based packaging, no-card trial, and explicit mobile-browser limitations.
- **Avoid:** assuming one dollar price works across regions; presenting mobile access as equivalent to a native app without documenting feature gaps.
- **Digi Tracks relevance:** H6 should quote by operational units that matter to the vertical—locations, practitioners, sites, transactions, or assets—not a generic seat count.

### 3.8 Fresha — consumer marketplace plus vertical business software

**Observed**

- **Positioning/audience:** two distinct audiences: consumers booking beauty/wellness services and businesses managing bookings, POS, marketing, payments, and reputation. (F1, F2)
- **IA/navigation:** consumer home prioritizes Search Fresha, app download, help, and For businesses; business navigation branches by salon, barber, nails, spa, and workflow. City/category pages support local discovery. (F1, F2, F4)
- **Proof/trust:** first-party scale claims, testimonials, review badges, app-store ratings, and security/compliance badges. These are publisher/platform claims, not independent verification here. (F1, F2, F5)
- **Pricing presentation:** the India page showed Independent and Team subscriptions as Free, alongside a new-client acquisition fee, usage charges after communication allowances, and optional add-ons. The experience is INR-localized and JavaScript-heavy. (F3)
- **Primary conversion:** consumers search/book; businesses follow Get started/Sign up to partner signup. The business page advertises a seven-day team trial without a credit card. (F1, F2)
- **Onboarding/demo:** help centre and Fresha Academy provide tutorials; iOS and Android business apps support operations. No sales-demo path was prominent in the observed public journey. (F2, F5, F6)
- **Content/SEO:** marketplace city/category/vertical pages, business feature pages, blog/help content, app listings, and multi-script localization. Older generic `/features` and `/resources` URLs returned 410; current feature content sits under business paths. (F1, F4, F6)
- **Mobile/responsive:** native customer/business apps exist. At 689 px the consumer home had viewport metadata, a main landmark, alt attributes on all 90 observed images, and no document overflow. Real-device behavior remains UNKNOWN. (F1, F5)
- **Accessibility signals:** semantic/ARIA and React Aria implementation signals were observed. The App Store listing states that the developer has not indicated supported accessibility features; that is not proof of either conformance or non-conformance. (F1, F5)

**Interpretation**

- **Adopt:** explicit consumer/business separation, local/vertical discovery, native mobile where field operations justify it, and visible usage/add-on economics.
- **Avoid:** marketplace scale and consumer booking mechanics on an enterprise quote-led site; “free” labels that require careful explanation of transaction/usage fees; badges without linked scope.
- **Digi Tracks relevance:** H6 should preserve distinct buyer and end-user journeys, and every host should state what “free,” “trial,” and “quote” actually include.

## 4. Concise cross-competitor matrix

### 4.1 Commercial model and conversion

| Competitor | Primary buyer/model | IA spine | Pricing posture | Primary conversion | Onboarding/demo posture |
|---|---|---|---|---|---|
| Odoo | SMB to enterprise; suite SaaS | Apps + industries | Public free/paid calculator; localized per-user pricing | Trial, buy, or advisor by size | Guided trial, verification, advisor/demo |
| ERPNext | Technical and business teams; open-source ERP | Modules + industries + partners | Free software; hosting + implementation; compute pricing | Cloud trial, self-host, partner, enterprise contact | App/plan/subdomain flow; docs and partners |
| Procurify | Mid-market procurement/finance/IT | Workflow + role + industry | Modular custom quote; no public amount | Demo or pricing request; tour first | Qualified demo, implementation guide, role KB |
| Oracle University | Individuals, teams, partners | Audience + product + credential | Subscription/exam products; price later in regional order flow | Free training, buy, or sales | MyLearn account, paths, labs, live sessions |
| Apache Superset | Analysts, admins, developers | User + admin + developer | No commercial project pricing | Install/quickstart/source/community | Local Docker or production deployment docs |
| Semgrep | Developers, AppSec, security leaders | Product + buyer role | Public free/Teams/Enterprise; contributor billing | Signup/free scan or demo | CLI/web signup, playground, registry |
| Cliniko | Allied-health practices | Specialty + feature + practice task | Public practitioner tiers; regional currency unclear | 30-day no-card trial | Account/location setup; help and connected apps |
| Fresha | Consumers + beauty/wellness businesses | Consumer search + business vertical/workflow | Free subscription label plus usage/add-on fees | Consumer booking or business signup/trial | Academy/help, native apps |

### 4.2 Content, mobile, accessibility, and transferable lesson

| Competitor | Content/SEO approach | Mobile/responsive observation | Accessibility signal | Best transferable lesson |
|---|---|---|---|---|
| Odoo | App/industry pages, versioned docs, tutorials, forum, blog | Mobile docs found; current parity UNKNOWN | Docs skip link; current ACR UNKNOWN | Catalogue breadth plus role-specific docs |
| ERPNext | Product/category blog, wiki docs, comparisons, stories | Responsive marketing/docs; native parity UNKNOWN | Docs main/nav signals; ACR UNKNOWN | Explain total cost and deployment choice |
| Procurify | Workflow/role/industry pages, gated reports, role KB | Native apps; compact layout no gross overflow | Skip/main observed; statement UNKNOWN | Quote by modules, users, integrations |
| Oracle University | Role/product paths, free sampler, certification/FAQ/docs | Responsive corporate site; documented 1024×768 playback floor | Dated, scoped ACR with partial support | Public outcomes/syllabus before account gate |
| Superset | Versioned role docs, tutorials, source, community | Optional read-only mobile mode | Test guidance; ACR UNKNOWN | Make mobile scope explicit |
| Semgrep | Technical docs, registry, playground, research | Responsive shell; native app not found | Missing landmarks in compact DOM; ACR UNKNOWN | Time-to-first-value and executable proof |
| Cliniko | Specialty pages, help, practice content, reviews | Mobile browser/home-screen guidance | ARIA observed; statement UNKNOWN | Package by operational unit |
| Fresha | City/category/vertical pages, blog, academy | Native apps; compact consumer layout stable | App listing does not indicate accessibility features | Separate consumer and business journeys |

## 5. Recommendations for Digi Tracks' six-host estate

The original research brief named six functions but not their production hostnames, so **H1–H6 below remain functional research labels**. Subsequent registry work declared the six canonical origins (`digitracks.net`, `learn.digitracks.net`, `sourcecraft.digitracks.net`, `procuresherpa.digitracks.net`, `learnpmo.digitracks.net` and `hcmfusion.digitracks.net`); operator ownership, DNS and release approval still require confirmation.

### 5.1 H1 — ERP/business-platform portal

- **Primary IA:** Outcomes → Products/modules → Industries → Implementation → Proof → Pricing approach → Start a scoped conversation. Keep the full catalogue one click below the decision path.
- **Conversion:** “Scope my platform” should open the shared quote flow with product interests, organization size, entities, users, integrations, migration, hosting region, and implementation timing.
- **Proof:** publish a module-to-workflow map, implementation responsibilities, migration approach, support boundaries, data-exit terms, and source-backed customer stories. Do not borrow Odoo/ERPNext scale claims.
- **Content:** module overviews, role guides, integration guides, glossary, release notes, and a “self-host/managed/partner” comparison only where Digi Tracks actually offers those choices.
- **Adopt/avoid:** adopt Odoo's discoverability and ERPNext's cost transparency; avoid mega-menu breadth and unverified “all-in-one” claims.

### 5.2 H2 — Procurement tools

- **Primary IA:** organize by buyer job—request, approve, source, order, receive, invoice/pay—then by role, organization type, and integration. This follows Procurify's strongest pattern.
- **Conversion:** offer an interactive workflow tour before the demo. Quote inputs should include request/PO volume, approvers, requesters, suppliers, catalogs, ERP/accounting integrations, cards/expenses, and implementation scope.
- **Proof:** show an approval/audit trail example, role permissions, integration list, and verified outcomes with customer permission and a measurement date. Label internal metrics as such.
- **Content:** procurement policy templates, approval-matrix guide, requester/approver/admin quickstarts, integration docs, and a procurement glossary.
- **Adopt/avoid:** adopt workflow language and modular pricing logic; avoid forcing every visitor into a demo or presenting unsupported savings percentages.

### 5.3 H3 — PMO learning

- **Primary IA:** learner role (PMO leader, project/programme manager, portfolio analyst), outcome (governance, delivery, reporting, change), level, and format. Borrow Oracle's role/outcome paths, not its credential scale.
- **Conversion:** expose sample lesson, outline, duration, prerequisites, facilitator/lab format, and accessibility before “Plan my learning.” Quote cohorts, seats, facilitation, assessment, and support.
- **Proof:** publish instructor credentials, curriculum authorship, sample assessment approach, and verified completion/outcome data. Do not imply accreditation or certification that Digi Tracks does not hold.
- **Content:** PMO glossary, governance templates, delivery playbooks, case-based lessons, and role-based learning paths. Keep public previews indexable; gate only material that genuinely requires enrolment.
- **Adopt/avoid:** adopt Oracle's free-to-paid ladder and Superset's task tutorials; avoid an account wall that hides the value of the curriculum.

### 5.4 H4 — HCM learning

- **Primary IA:** role (HR leader, HR operations, payroll/admin, implementation consultant), product/version, task, and proficiency. Make product/version compatibility visible on every path.
- **Conversion:** “Plan team training” should capture learner roles, current product version, cohort size, lab/sandbox needs, delivery mode, timeline, and support. Offer a sample lab or diagnostic only if it is real and maintained.
- **Proof:** author expertise, reviewed curriculum, lab environment, assessment method, update cadence, and any verifiable vendor authorization. Payroll/legal content needs region and effective date.
- **Content:** role guides, product-release learning, payroll calendars by verified region, implementation walkthroughs, captions/transcripts, and downloadable job aids.
- **Adopt/avoid:** adopt Oracle's documented requirements and credential transparency; avoid stale accreditation claims, regionless compliance advice, and inaccessible video-only learning.

### 5.5 H5 — Developer/security tooling

- **Primary IA:** Docs/Quickstart first for developers; Platform/Security/Governance for buyers. Provide Install → First scan/build → Integrate → Operate → Upgrade as the main path.
- **Conversion:** support a genuine free/local/open tier if available, with explicit licence and data handling. Commercial conversion should be “Start free,” “Talk to engineering,” or “Scope team deployment,” not a generic sales form.
- **Proof:** executable examples, playground/sandbox, registry/rules where relevant, changelog, security policy, responsible disclosure, dependency/licence inventory, and scoped assurance reports.
- **Content:** copyable commands, API reference, CI integrations, troubleshooting, architecture, data-flow diagrams, migration guides, and versioned release notes. Server-render the important text so docs remain useful without heavy client JavaScript.
- **Adopt/avoid:** adopt Semgrep's time-to-first-value and Superset's role-separated operations docs; avoid security badges that cannot be traced to a dated, scoped artefact.

### 5.6 H6 — Vertical operations software

- **Primary IA:** industry → operational role → workflow → product capability → integrations → proof. Add region only where compliance, language, currency, or service availability truly differs.
- **Conversion:** quote by the vertical's real unit—sites, locations, practitioners, jobs, assets, bookings, or transactions—plus implementation, migration, training, and support.
- **Proof:** named, permissioned case studies; workflow demonstrations; integration evidence; data residency; support coverage; and region-specific compliance only when verified.
- **Content:** vertical glossaries, workflow checklists, implementation guides, operational reports, local landing pages with original substance, and mobile/field-use guidance.
- **Adopt/avoid:** adopt Cliniko's specialty clarity and Fresha's business/end-user separation; avoid consumer-marketplace mechanics, shallow city doorway pages, and “free” pricing that conceals usage fees.

### 5.7 Estate-wide IA and cross-host behavior

- Add a restrained **estate switcher** to every host: six plain-language destinations, a one-line description, and a clear “You are here” state. Do not use a logo wall as navigation.
- Use shared design tokens, header/footer behavior, forms, proof components, accessibility primitives, and analytics schema. Keep host-specific primary navigation and terminology.
- Give every product page one canonical host. Cross-host links should connect complementary tasks, not duplicate the same sales page on six domains.
- Maintain one structured product registry containing owner, audience, capabilities, lifecycle, licence, pricing model, proof artefacts, related learning, and quote route. Navigation, cards, schemas, and quote forms should consume it.
- Carry source host, landing page, product interest, and consented campaign context into the quote payload. Never send a visitor to a generic contact form without preserving intent.
- Keep each host's sitemap and robots rules independent. A shared sitemap index may reference them, but each URL must have a self-referential canonical and evidence-based freshness.

### 5.8 Quote-led model specification

1. **Explain the pricing posture.** Say whether the product is free, trial-led, subscription-led, usage-priced, or quoted. If quoted, list the cost drivers before asking for contact details.
2. **Use progressive scoping.** Start with product/host, organization type, and primary outcome. Ask seats/volume, integrations, deployment, migration, training, and support only when relevant.
3. **Show what happens next.** State expected response window, consultation format, who receives the request, and whether a demo is optional. Do not invent an SLA; publish one only when operations can meet it.
4. **Return a reference.** Confirmation should include a quote/request ID, selected scope, contact route, and a way to correct details. Preserve the form state after errors.
5. **Separate estimate from quote.** Any calculator output is “illustrative” until reviewed; its assumptions and exclusions must be visible. No fabricated “starting at” figures.
6. **Keep self-serve evidence available.** Docs, tours, sample content, and security overviews must remain accessible without a sales call. Gated artefacts can follow qualification.
7. **Route by intent.** Developer trial, individual learning, team learning, implementation partner, and enterprise procurement should not land in the same undifferentiated queue.
8. **Measure quote quality, not only volume.** Track completed scope, source host, product mix, integrations, response time, and accepted quote—without inventing baseline targets.

### 5.9 Trust, content, mobile, and accessibility standards

- **Proof ladder:** source/documentation → reproducible demonstration → permissioned customer evidence → dated third-party audit/ACR. Vendor claims must be labeled; missing evidence is UNKNOWN, not a decorative badge.
- **SEO:** prefer server-rendered, indexable text; unique titles/canonicals; original role/workflow/industry content; structured data only for facts; real `lastmod`; and no doorway pages. Search performance must be measured later.
- **Mobile:** test 390/320/768/1440, orientation, zoom, long names, and forms. Keep quote CTAs visible without covering content. Do not promise native-app parity unless it exists; document read-only or limited mobile modes.
- **Accessibility target:** propose WCAG 2.2 AA as a project acceptance target, not a current claim. Require semantic landmarks, skip links, keyboard/focus behavior, labelled forms, useful alt text, captions/transcripts, contrast, reduced motion, and accessible error messages.
- **Accessibility evidence:** combine automated checks with manual keyboard, screen-reader, zoom, and real-device testing. Publish a dated statement with scope, known issues, contact route, and remediation plan. An overlay or automated score is not conformance evidence.
- **Regionalization:** show country/currency/units explicitly; date regional compliance content; do not silently reuse another market's price, tax, payment, data-residency, or legal claim.

### 5.10 Delivery sequence and validation gates

- **P0 — Decide and inventory:** approve H1–H6 roles, operator owners, the declared canonical map, product registry, proof ledger, pricing posture and quote routing. The six hostnames are now declared; DNS and release ownership still require confirmation. Remove unsupported claims before design.
- **P1 — Build the decision system:** shared components, estate switcher, host-specific navigation, quote flow, trust centre shell, docs shells, role/industry templates, and analytics events.
- **P2 — Populate and prove:** publish verified stories, security artefacts, curricula, quickstarts, integration guides, regional pricing logic, and accessibility statements. Test with real buyers and learners.
- **Release gate:** every CTA has a working destination; every quote payload preserves intent; every price has region/unit/inclusions; every metric has provenance; every host passes canonical/sitemap checks.
- **Quality gate:** no horizontal overflow at agreed breakpoints; keyboard and screen-reader completion of primary journeys; accessible forms and errors; mobile quote completion; no broken estate links; no unverified compliance or accreditation language.
- **Measurement gate:** instrument product view, tour start, docs/quickstart success, quote start, quote submit, demo request, and learning enquiry by host. Baselines and targets are UNKNOWN until measured.

## 6. Risks, gaps, and honest unknowns

| Gap | Impact | Resolution |
|---|---|---|
| Research-time hostname/owner gap | Initial recommendations used functional H1–H6 labels | Six canonical origins are now declared; operator ownership, DNS and release approval remain owner actions |
| Research-time product/licence evidence gap | Exact prices and commercial approval remained unverified | The catalogue now records source-derived licence/buying models; exact prices, owner approval and customer proof remain dependencies |
| No full assistive-technology audit of competitors | Accessibility comparisons are signals, not conformance findings | Test Digi Tracks directly; require dated scoped evidence from vendors |
| Prices are geo-localized and some currencies unclear | Competitor figures cannot be generalized | Recheck per target market before commercial decisions |
| JavaScript-only/gated pages limited observation | Some catalogues, forms, and reports remain unseen | Repeat with authorized accounts or vendor-provided artefacts |
| Mobile evidence is mostly compact-browser/documentation based | Native parity and real-device usability remain UNKNOWN | Run 390/320 px and device testing on Digi Tracks |
| Search rankings, traffic, and conversion performance not measured | Cannot claim a competitor “wins” SEO or conversion | Use the patterns as hypotheses; validate with Digi Tracks analytics and user tests |
| Customer counts, ratings, ROI, and badges are publisher claims | Repetition would create unsupported Digi Tracks proof | Cite provenance/date or omit; prefer permissioned primary evidence |

## Sources

All links were accessed on **2026-11-25**. Unless noted, they are official first-party pages or documentation. App-store metadata is labeled as platform-published secondary evidence.

### Odoo

- **O1** — [Odoo home](https://www.odoo.com/)
- **O2** — [Odoo pricing](https://www.odoo.com/pricing)
- **O3** — [Odoo free trial](https://www.odoo.com/trial)
- **O4** — [Odoo documentation index](https://www.odoo.com/page/docs)
- **O5** — [Odoo mobile apps documentation](https://www.odoo.com/documentation/20.0/administration/mobile.html) — body unavailable/truncated in this pass
- **O6/O7** — [Odoo security](https://www.odoo.com/security) · [Odoo community](https://www.odoo.com/page/community)
- **O8/O9** — [Odoo blog](https://www.odoo.com/blog) · [About Odoo](https://www.odoo.com/page/about-us)

### ERPNext / Frappe

- **E1** — [ERPNext, rendered India region](https://frappe.io/erpnext/india)
- **E2** — [ERPNext pricing](https://frappe.io/erpnext/pricing)
- **E3** — [Frappe Cloud](https://frappe.io/cloud)
- **E4** — [ERPNext documentation introduction](https://docs.frappe.io/erpnext/introduction)
- **E5/E6** — [Frappe customer stories](https://frappe.io/stories) · [Frappe blog](https://frappe.io/blog)
- **E7/E8** — [Frappe security disclosure](https://frappe.io/security) · [ERPNext source repository](https://github.com/frappe/erpnext)

### Procurify

- **P1** — [Procurify home](https://www.procurify.com/)
- **P2** — [Procurify features](https://www.procurify.com/platform/features/)
- **P3** — [Procurify pricing](https://www.procurify.com/pricing/)
- **P4** — [Procurify demo request](https://www.procurify.com/get-started/)
- **P5/P6** — [Procurify knowledge base](https://success.procurify.com/en/) · [Procurify customers](https://www.procurify.com/customers/)
- **P7/P8** — [Procurify security](https://www.procurify.com/security/) · [Procurify resources](https://www.procurify.com/resources/)

### Oracle University

- **U1** — [Oracle University, India](https://www.oracle.com/in/education/)
- **U2** — [Oracle training and certification](https://www.oracle.com/in/education/training/)
- **U3** — [Buy Oracle University training and certifications](https://www.oracle.com/in/education/training/buy/)
- **U4** — [Oracle MyLearn free Foundations story](https://mylearn.oracle.com/ou/story/163512) — JavaScript shell in static fetch
- **U5** — [Oracle MyLearn 2.4 Accessibility Conformance Report](https://www.oracle.com/latam/corporate/accessibility/templates/t2-12953.html) — archived, version-scoped
- **U6/U7** — [Oracle University playback requirements](https://docs.oracle.com/en/education/customer-success/digital-learning-kit/ml-dl-faq/topics/Playback.html) · [Certification FAQs](https://docs.oracle.com/en/education/customer-success/digital-learning-kit/ml-cert-faq/topics.html)

### Apache Superset

- **S1** — [Apache Superset home](https://superset.apache.org/)
- **S2** — [Superset quickstart](https://superset.apache.org/user-docs/quickstart)
- **S3** — [Superset installation methods](https://superset.apache.org/admin-docs/installation/installation-methods)
- **S4** — [Superset security configuration](https://superset.apache.org/admin-docs/security/)
- **S5/S6** — [Contributing to Superset](https://superset.apache.org/developer-docs/contributing/overview) · [Superset community](https://superset.apache.org/community)
- **S7** — [Superset mobile experience](https://superset.apache.org/user-docs/using-superset/mobile-experience/)
- **S8/S9** — [Superset testing guidelines](https://superset.apache.org/developer-docs/testing/testing-guidelines/) · [Superset source repository](https://github.com/apache/superset)

### Semgrep

- **M1** — [Semgrep home](https://semgrep.dev/)
- **M2** — [Semgrep pricing](https://semgrep.dev/pricing/)
- **M3** — [Semgrep Cloud Platform](https://semgrep.dev/products/cloud-platform/)
- **M4** — [Semgrep quickstart](https://docs.semgrep.dev/getting-started/quickstart)
- **M5** — [Semgrep Trust Portal](https://trust.semgrep.dev/)
- **M6/M7** — [Semgrep Community Edition](https://semgrep.dev/products/community-edition/) · [Semgrep blog](https://semgrep.dev/blog/)

### Cliniko

- **C1** — [Cliniko home](https://www.cliniko.com/)
- **C2** — [Cliniko pricing](https://www.cliniko.com/pricing/)
- **C3** — [Cliniko features](https://www.cliniko.com/features/)
- **C4** — [Cliniko free trial](https://www.cliniko.com/free-trial/)
- **C5** — [Access Cliniko on a mobile device](https://help.cliniko.com/en/articles/1141545-access-cliniko-on-a-mobile-device)
- **C6** — [Cliniko security](https://www.cliniko.com/security/)
- **C7/C8** — [Cliniko customer stories](https://www.cliniko.com/customers/) · [Cliniko blog](https://www.cliniko.com/blog/)

### Fresha

- **F1** — [Fresha consumer home](https://www.fresha.com/)
- **F2** — [Fresha for business](https://www.fresha.com/for-business)
- **F3** — [Fresha pricing](https://www.fresha.com/pricing)
- **F4** — [Fresha business features](https://www.fresha.com/for-business/features/)
- **F5** — [Fresha for business, Apple App Store](https://apps.apple.com/us/app/fresha-for-business/id1455346253) — platform-published metadata
- **F6** — [Fresha support](https://www.fresha.com/support)
