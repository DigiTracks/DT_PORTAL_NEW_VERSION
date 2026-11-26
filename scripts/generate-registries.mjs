import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { stripTypeScriptTypes } from "node:module";
import { socialCardPath } from "../packages/seo/src/social.ts";

const root = path.resolve(import.meta.dirname, "..");
const referenceRoot = process.argv[2] ?? "/data/HomeWorks/DT-Portal-main";
const generatedAt = new Date().toISOString().slice(0, 10);
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const shortHash = (value) => crypto.createHash("sha1").update(value).digest("hex").slice(0, 12);
const writeTs = (relativePath, name, value) => {
  const destination = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `// Generated from the approved audit baseline on ${generatedAt}.\nexport const ${name} = ${JSON.stringify(value, null, 2)} as const;\n`);
};

const source = fs.readFileSync(path.join(referenceRoot, "src/data/products.ts"), "utf8");
const executable = stripTypeScriptTypes(source, { mode: "transform" })
  .replace(/^import type.*$/gm, "")
  .replace(/^export const /gm, "const ");
const { ALL_PRODUCTS } = new Function(`${executable}\nreturn { ALL_PRODUCTS };`)();

const buyingModels = {
  vedik: "subscription", chronos: "one-off", glowra: "one-off", nipuna: "one-off", vertex: "one-off",
  unify: "subscription", orion: "quote-led", "orion-hunter": "quote-led", construction: "subscription",
  transportation: "subscription", sherpa: "free", "quote-simulator": "one-off",
  opspilot: "free", vantor: "free", recon: "free", "campus-grid": "subscription", procure5: "subscription"
};
const specificClaims = {
  mindone: ["CLM-004"], opspilot: ["CLM-008"], recon: ["CLM-009"], vantor: ["CLM-010"],
  orion: ["CLM-011"], chronos: ["CLM-012"], unify: ["CLM-012"]
};
const learningPaths = {
  procure5: "procuresherpa", "sherpa-toolkit": "procuresherpa", learnpmo: "learnpmo",
  hcmfusion: "hcmfusion", sourcecraft: "sourcecraft"
};
const deploymentLabels = {
  docker: "Self-hosted on infrastructure you control", installer: "Windows desktop installer", npm: "Installed from a package manager",
  tauri: "Desktop application", electron: "Desktop application", vercel: "Hosted browser application", static: "Static web application"
};

const products = ALL_PRODUCTS.map((product) => {
  const licence = product.license;
  const licenseModel = product.id === "opspilot" || product.id === "vantor"
    ? "open-source"
    : product.id === "recon" ? "source-available" : "proprietary";
  const buyingModel = buyingModels[product.id] ?? (product.parentProduct ? buyingModels[product.parentProduct] : "quote-led") ?? "quote-led";
  const status = String(product.status ?? "Unknown");
  const availability = ["Concept", "Prototype", "Research", "Planned"].includes(status) ? "request-only" : "available";
  const claims = [
    { id: "CLM-002", status: "verified" },
    { id: "CLM-005", status: "verified" },
    ...(specificClaims[product.id] ?? []).map((id) => ({ id, status: id === "CLM-008" || id === "CLM-009" ? "verified" : "site-stated" }))
  ];
  return {
    id: product.id,
    name: product.name,
    summary: product.tagline || product.description,
    description: product.description,
    audience: `Teams evaluating ${product.category.toLowerCase()} software`,
    category: product.category,
    licenseModel,
    buyingModel,
    availability,
    requestable: true,
    licenseEvidence: licence?.url,
    licenceNote: licence ? `${licence.name}${licence.spdx ? ` (${licence.spdx})` : ""}` : product.id === "vantor" ? "The site states AGPL-3.0-or-later; public source availability remains unverified." : undefined,
    claims,
    assetIds: product.logo ? [`product:${path.posix.basename(product.logo, ".webp")}`] : [],
    learningPathId: learningPaths[product.id],
    parentId: product.parentProduct,
    capabilities: product.capabilities ?? [],
    platforms: product.platforms ?? [],
    deployment: deploymentLabels[product.deployment] ?? "Deployment details require confirmation",
    status,
    route: product.route,
    logo: product.logo,
    installCommand: product.installCommand
  };
});

const productCorrections = {
  vedik: {
    summary: "Education operations for schools, colleges and universities",
    description: "Vedik is an education-platform family. Its public School ERP demo shows role-based school operations with sample data, including learner records, attendance, academics, fees and administration. Production deployment, the wider application family and offline behavior require evaluation.",
    audience: "School, college and university administrators, principals, teachers and education operations teams",
    capabilities: [
      "Role-based school dashboards and records",
      "Students, teachers, attendance, classes and sections",
      "Timetable, exams, marks and homework",
      "Fees, finance, payroll and printable receipts",
      "Library, transport, hostel and inventory",
      "Communication, certificates and reports",
      "Staff, leave, users, roles and licensing",
      "Printable certificates, ID cards and payslips"
    ],
    platforms: ["Web"],
    deployment: "Public static School ERP demo; production deployment requires evaluation",
    status: "Demo available / production evaluation",
    evidenceStatus: "code-backed",
    evidenceNote: "The public demo uses mock data and browser-stored persona state. It does not prove production backend, mobile or offline behavior.",
    industryIds: ["education"],
    claims: [{ id: "CLM-002", status: "verified" }, { id: "CLM-038", status: "verified" }]
  },
  nipuna: {
    summary: "Local-first recruiting, résumé intelligence and candidate pipelines",
    description: "Nipuna is a local-first recruiting toolkit for résumé intake, deterministic candidate matching and hiring pipelines. Its published scope includes local parsing and OCR, requisition workflows and token-gated questionnaires. Matching is rule-based, not generative AI; implementation and deployment readiness require assessment.",
    audience: "HR teams, recruiters and hiring managers handling high-volume résumé review",
    capabilities: [
      "Job-description generation and role library",
      "Local résumé parsing and OCR",
      "Department-aware rule-based skill matching",
      "Four-tier candidate-fit scoring",
      "Requisition-stage candidate pipeline",
      "Email and token-linked skill-gap questionnaires",
      "Token-gated candidate response portal",
      "Four-role access control and local desktop operation"
    ],
    platforms: ["Windows"],
    deployment: "Windows desktop installer; deployment assessment required",
    status: "Vendor-stated / deployment assessment",
    evidenceStatus: "vendor-stated",
    evidenceNote: "No public implementation, measured matching accuracy, ATS integration or independent readiness evidence was verified.",
    industryIds: ["recruitment", "business-operations"],
    claims: [{ id: "CLM-002", status: "verified" }, { id: "CLM-039", status: "site-stated" }]
  },
  vertex: {
    summary: "Self-contained project and procurement management",
    description: "Vertex is a self-contained project and procurement platform. Its public showcase demonstrates requisition-to-invoice and sealed RFQ workflows using fictional data. The published production scope includes local deployment, contract-gated purchase orders, finance approvals and three-way matching; request a production evaluation rather than treating the showcase as proof of parity.",
    audience: "Procurement, commercial, project and capital-programme teams requiring local data control",
    capabilities: [
      "PR → RFQ → PO → GRN → Invoice",
      "Sealed technical and commercial RFQ evaluation",
      "Contract-gated purchase orders and finance approvals",
      "Split allocation across multiple suppliers",
      "WBS budgets and project progress",
      "Three-way matching and receiving gates",
      "Contracts, claims and risk registers",
      "Exact-money calculations and audit lineage"
    ],
    platforms: ["Windows", "Web showcase"],
    deployment: "Windows desktop installer; public showcase uses fictional data",
    status: "Showcase demo / production evaluation",
    evidenceStatus: "mixed",
    evidenceNote: "Workflow scope is observable in a fictional showcase demo. Production implementation, integrations and edition entitlements remain unverified.",
    industryIds: ["procurement", "construction"],
    claims: [{ id: "CLM-002", status: "verified" }, { id: "CLM-040", status: "verified" }]
  },
  sherpa: {
    summary: "Browser-based procurement learning and decision support",
    description: "Procure Sherpa is a free browser-based procurement learning and decision-support toolkit. It combines Academy learning, calculators, SOPs, checklists, templates, scenarios and local saved work. Its copilot retrieves from bundled knowledge rather than calling a verified language model, and document packs open the browser print dialog. It is not a procurement ERP and does not process purchase orders.",
    audience: "Procurement practitioners, analysts and teams building practical procurement capability",
    capabilities: [
      "Academy modules, progress, quizzes and local exam history",
      "Financial and procurement calculators",
      "SOPs, checklists, templates and decision guides",
      "Commercial scenarios and KPI views",
      "Local saved calculations and JSON backup/restore",
      "Document Pack Builder with browser print output",
      "Local retrieval copilot with linked source citations",
      "Configurable organisation, currency, tax and display settings"
    ],
    platforms: ["Web browser"],
    deployment: "Browser application; saved state remains on the device",
    status: "Available",
    buyingModel: "free",
    evidenceStatus: "code-backed",
    evidenceNote: "The current live build has no verified native PDF generation, accredited credential, external AI provider, team workflow engine or offline PWA.",
    industryIds: ["procurement"],
    learningPathId: "procuresherpa",
    claims: [{ id: "CLM-002", status: "verified" }, { id: "CLM-041", status: "verified" }]
  },
  vantor: {
    summary: "Self-hostable procurement operating system for evaluation",
    description: "Vantor is a self-hostable procurement operating system spanning suppliers, sourcing, contracts, purchasing, spend and governed AI-assisted workflows. Public source shows a local SQLite option and a multi-tenant Postgres deployment. The repository explicitly describes the software as not production-hardened, so deployment, support, licence terms and AI evidence behavior require owner confirmation before production use.",
    audience: "Procurement, finance, legal, audit and platform teams evaluating a self-hosted system",
    capabilities: [
      "Supplier onboarding, qualification, risk and scorecards",
      "RFQ, quotation comparison, award and allocation",
      "Contracts, obligations, renewals and matching",
      "Requisition-to-invoice with approvals and three-way match",
      "Spend, should-cost and price intelligence",
      "Document upload and lexical search",
      "Typed AI tools with role checks and human approvals",
      "Hash-chained audit, RBAC, tenant isolation and OIDC"
    ],
    platforms: ["Web", "SQLite", "PostgreSQL"],
    deployment: "Single-container SQLite or self-hosted Postgres/Redis/worker/Keycloak",
    status: "Public evaluation release / not production-hardened",
    licenseModel: "unknown",
    buyingModel: "unknown",
    licenseEvidence: undefined,
    licenceNote: "Published sources conflict between AGPL-3.0-or-later and Apache-2.0. Confirm the applicable licence with the owner.",
    evidenceStatus: "mixed",
    evidenceNote: "Public repository evidence conflicts with the official page on licence, production readiness and AI citations. No OCR, verified semantic-search quality, named ERP connector or MCP implementation is claimed.",
    industryIds: ["procurement"],
    claims: [{ id: "CLM-002", status: "verified" }, { id: "CLM-010", status: "unknown" }]
  }
};

for (const product of products) {
  const correction = productCorrections[product.id];
  if (correction) Object.assign(product, correction);
}

const mindOneRecord = {
  id: "mindone", name: "MIND ONE", summary: "Résumé-grounded interview practice with answer-specific coaching",
  description: "MIND ONE is a pre-launch interview-practice product for candidates and career changers. Its published scope covers résumé-grounded questions, spoken or typed answers, answer-specific coaching and a structured debrief. It is planned with Free and Pro variants; production availability, approved edition entitlements and outcomes are not yet published.",
  audience: "Interview candidates, career changers and people practising competency-based interviews",
  category: "Education", licenseModel: "proprietary", buyingModel: "unknown",
  availability: "request-only", requestable: true, edition: "Flagship / Free entry edition",
  claims: [{ id: "CLM-004", status: "site-stated" }, { id: "CLM-037", status: "site-stated" }],
  assetIds: [], capabilities: [
    "Résumé and job-description-grounded practice questions",
    "Browser speech input with typed fallback",
    "Answer-specific coaching and model-answer rewriting",
    "Optional numeric scoring",
    "Prioritised debrief tips and a drill sheet",
    "Performance, competency and career-ladder readouts",
    "Local-only default with optional hosted AI by explicit consent",
    "In-memory sessions with no account or telemetry"
  ],
  platforms: [], deployment: "Pre-launch; deployment and provider details require confirmation",
  status: "Pre-launch / request only", route: "/products/mindone", evidenceStatus: "vendor-stated",
  evidenceNote: "No public implementation, release approval, launch date, provider list or measured outcome was verified.",
  industryIds: ["education", "recruitment"]
};
const mindOneIndex = products.findIndex((product) => product.id === mindOneRecord.id);
if (mindOneIndex >= 0) products[mindOneIndex] = mindOneRecord;
else products.push(mindOneRecord);

const mindOneProRecord = {
  id: "mindone-pro", name: "MIND ONE Pro", summary: "The planned complete MIND ONE edition",
  description: "MIND ONE Pro is described as the complete MIND ONE variant. Its approved entitlement table, price, deployment and release timing are not published, so this page records qualified interest without implying that Pro-only features or access are available.",
  audience: "Candidates and organisations seeking the planned complete MIND ONE edition",
  category: "Education", licenseModel: "proprietary", buyingModel: "unknown",
  availability: "request-only", requestable: true, parentId: "mindone", edition: "Planned complete edition",
  claims: [{ id: "CLM-004", status: "site-stated" }, { id: "CLM-037", status: "site-stated" }],
  assetIds: [], capabilities: [
    "Complete-edition positioning published by the vendor",
    "Approved feature entitlements pending",
    "Price and licence terms pending",
    "Release timing pending"
  ],
  platforms: [], deployment: "Pre-launch; deployment details require confirmation",
  status: "Pre-launch / entitlement review", route: "/products/mindone-pro", evidenceStatus: "vendor-stated",
  evidenceNote: "No verified Pro-only feature, quota, integration, price or launch date is published.",
  industryIds: ["education", "recruitment"]
};
const mindOneProIndex = products.findIndex((product) => product.id === mindOneProRecord.id);
if (mindOneProIndex >= 0) products[mindOneProIndex] = mindOneProRecord;
else products.push(mindOneProRecord);

const solutions = [
  {
    id: "education",
    name: "Education & Academics",
    summary: "Education operations and career practice, with distinct tools for institutions and individuals.",
    audience: "School, college and university administrators, education operations teams, candidates and career changers",
    challenge: "Education teams need clear operational records, while candidates need focused interview practice. Those are different workflows and should not be presented as one system.",
    workflow: [
      { title: "Run the institution", description: "Evaluate Vedik's public School ERP demo for role-based records, attendance, academics, fees and administration." },
      { title: "Prepare the candidate", description: "Review MIND ONE's pre-launch résumé-grounded practice and answer-specific coaching scope." },
      { title: "Confirm the boundary", description: "Separate sample-data demonstrations from production deployment, edition access and measured outcomes." }
    ],
    outcomes: ["A scoped education-operations evaluation", "A clear candidate-practice access request", "Documented deployment and evidence questions"],
    productIds: ["vedik", "mindone"],
    industryIds: ["education"]
  },
  {
    id: "healthcare",
    name: "Clinical Healthcare",
    summary: "Appointments, records and billing for outpatient clinics and specialty practices.",
    audience: "Clinic administrators, reception teams, practitioners and billing coordinators",
    challenge: "Outpatient teams need coordinated scheduling and records without assuming that every deployment, integration or compliance requirement is already covered.",
    workflow: [
      { title: "Map the patient journey", description: "Identify appointment, record and billing hand-offs that matter to the practice." },
      { title: "Evaluate Chronos", description: "Compare the published workflow scope with your staffing, deployment and reporting needs." },
      { title: "Plan the decision", description: "Request a qualified demonstration and record integration, migration and support questions." }
    ],
    outcomes: ["A defined clinic workflow scope", "A qualified product evaluation", "An explicit integration and deployment checklist"],
    productIds: ["chronos"],
    industryIds: ["healthcare"]
  },
  {
    id: "beauty-wellness",
    name: "Beauty & Wellness",
    summary: "Calendars, checkout, client notes and stock control for salons, spas and wellness studios.",
    audience: "Salon, spa and wellness operators, reception teams and studio managers",
    challenge: "Client-facing service businesses need coordinated bookings and daily operations without adding unnecessary administrative work.",
    workflow: [
      { title: "Review the day", description: "Map bookings, client notes, checkout and stock movements across a typical working day." },
      { title: "Evaluate Glowra", description: "Compare the published functions with the studio's service menu and operating model." },
      { title: "Prepare the change", description: "Identify data migration, staff access and support requirements before a rollout decision." }
    ],
    outcomes: ["A practical studio workflow map", "A scoped software evaluation", "A clear migration and training brief"],
    productIds: ["glowra"],
    industryIds: ["beauty-wellness"]
  },
  {
    id: "business-operations",
    name: "Business Operations",
    summary: "Modular business applications that can run independently or share one operating model.",
    audience: "Operations leaders, department owners, finance teams and business systems administrators",
    challenge: "Growing teams need to improve one operational area without committing to an unnecessary whole-estate replacement.",
    workflow: [
      { title: "Choose the first process", description: "Identify the operational constraint with the clearest owner and measurable next step." },
      { title: "Compare the module", description: "Review the relevant Unify module and the boundaries of its published scope." },
      { title: "Decide the sequence", description: "Plan a focused evaluation before considering a broader shared operating model." }
    ],
    outcomes: ["A prioritised operational use case", "A module-level evaluation", "A staged adoption decision"],
    productIds: ["unify"],
    industryIds: ["business-operations"]
  },
  {
    id: "procurement",
    name: "Procurement & Sourcing",
    summary: "Procurement operations, integrity, learning and decision support—distinct tools with explicit boundaries.",
    audience: "Procurement, sourcing, finance, commercial, legal, audit and platform teams",
    challenge: "Teams need to distinguish an operating platform from an integrity suite, a fictional showcase and a learning toolkit before choosing an evaluation path.",
    workflow: [
      { title: "Define the procurement job", description: "Separate supplier operations, sourcing, contract control, spend, integrity checks and practitioner learning." },
      { title: "Compare the instruments", description: "Review Vertex, Vantor, Procure5 and Procure Sherpa by evidence, deployment and intended user." },
      { title: "Request the right access", description: "Ask for a production evaluation, implementation discussion or learning access rather than assuming they are interchangeable." }
    ],
    outcomes: ["A clear procurement system map", "An evidence-led product shortlist", "A qualified evaluation or learning request"],
    productIds: ["vertex", "vantor", "procure5", "sherpa"],
    industryIds: ["procurement"]
  },
  {
    id: "recruitment",
    name: "Recruitment",
    summary: "Local résumé intake, deterministic candidate matching and interview practice.",
    audience: "HR teams, recruiters, hiring managers and candidates preparing for competency-based interviews",
    challenge: "Hiring teams need a reviewable shortlist, while candidates need structured practice. Rule-based matching and AI-assisted coaching must not be conflated.",
    workflow: [
      { title: "Structure the role", description: "Define the requisition, required capabilities and review responsibilities." },
      { title: "Evaluate Nipuna", description: "Assess vendor-stated local résumé parsing, OCR and deterministic candidate-fit scoring." },
      { title: "Prepare the candidate", description: "Review MIND ONE's pre-launch practice scope without implying an integration with the hiring workflow." }
    ],
    outcomes: ["A defined requisition and scoring brief", "A deployment assessment request", "A separate interview-practice path"],
    productIds: ["nipuna", "mindone"],
    industryIds: ["recruitment"]
  }
].map((solution) => ({ ...solution, claims: [{ id: "CLM-003", status: "verified" }] }));

const hubs = [
  { id: "developer-tools", name: "Developer & Security Tools", summary: "Local-first code audit, security, project operations and engineering tools.", toolIds: ["orion", "orion-hunter", "opspilot", "recon"] },
  { id: "field-operations", name: "Projects, Sites & Logistics", summary: "Project, site, fleet, route, driver and freight operations. Construction and Transportation remain available for focused evaluation.", toolIds: ["construction", "transportation"] }
];

writeTs("packages/catalog/src/catalog.generated.ts", "catalogData", { products, solutions, hubs });

const inventory = JSON.parse(fs.readFileSync(path.join(root, "inventories/routes.json"), "utf8"));
const originByHost = {
  "https://digitracks.net": "portal", "https://learn.digitracks.net": "learn", "https://sourcecraft.digitracks.net": "sourcecraft",
  "https://procuresherpa.digitracks.net": "procuresherpa", "https://learnpmo.digitracks.net": "learnpmo", "https://hcmfusion.digitracks.net": "hcmfusion"
};
const originHost = Object.fromEntries(Object.entries(originByHost).map(([host, id]) => [id, host]));
const trailingSlash = { portal: true, learn: true, sourcecraft: true, procuresherpa: false, learnpmo: true, hcmfusion: true };
const humanize = (value) => value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const cleanTitle = (value) => String(value ?? "")
  .replace(/DigiTracks/g, "Digi Tracks")
  .replace(/HCM Studio/g, "HCM Fusion")
  .replace(/Project Management 360 — Version 2\.0/g, "LearnPMO")
  .replace(/Project Management 360/g, "LearnPMO")
  .replace(/\s*[|·]\s*Digi Tracks\s*$/g, "")
  .trim();
const canonicalPath = (origin, rawPath) => {
  if (rawPath.includes("#")) return rawPath;
  if (origin === "procuresherpa") return rawPath === "/" ? "/" : rawPath.replace(/\/$/, "");
  return rawPath === "/" || rawPath.endsWith("/") ? rawPath : `${rawPath}/`;
};
const absoluteUrl = (origin, routePath) => {
  const url = new URL(routePath, originHost[origin]);
  if (trailingSlash[origin] && url.pathname !== "/" && !url.pathname.endsWith("/")) url.pathname += "/";
  if (!trailingSlash[origin] && url.pathname !== "/" && url.pathname.endsWith("/")) url.pathname = url.pathname.slice(0, -1);
  return url.toString();
};
const learnpmoTitles = {
  assessments: "Practice assessments", cohort: "Cohort practice", controls: "Project controls", dashboard: "Practice workspace",
  documents: "Document templates", exams: "Mock project management exams", industries: "Industry practice", lessons: "Project management lessons",
  plan: "Study plan", pmo: "PMO practice", portfolio: "Portfolio management practice", programme: "Programme management practice"
};
const sourcecraftIndexable = new Set(["/", "/about/", "/explore/", "/regions/", "/sources/"]);
const hcmIndexable = new Set(["/", "/sources/gaps/", "/sources/releases/"]);
const blockedHcmTemplates = new Set(["course", "lesson", "concept", "glossary-entry", "evidence-claim", "assessment", "certification-paper", "procedure", "scenario", "module-export"]);

function routeTitle(origin, raw, routePath, product) {
  if (origin === "portal" && product) return `${product.name} | Digi Tracks`;
  if (origin === "learnpmo" && raw.sitemapMember) return `${learnpmoTitles[routePath.replace(/^\//, "").replace(/\/$/, "")] ?? humanize(routePath)} | LearnPMO`;
  if (origin === "procuresherpa" && routePath === "/") return "ProcureSherpa | Local-first procurement learning";
  if (origin === "hcmfusion" && routePath === "/") return "HCM Fusion | Human capital learning library";
  const measured = cleanTitle(raw.measurement?.title);
  if (measured) return measured;
  return `${humanize(routePath.split("/").filter(Boolean).at(-1) ?? "Home")} | Digi Tracks`;
}

function routeDescription(origin, raw, title, product) {
  if (product) return product.summary;
  if (raw.template === "term") return `${title}: a SourceCraft reference route. Editorial approval and content permission are pending, so no definition is republished.`;
  if (origin === "hcmfusion") return `${title}: an HCM Fusion route preserving the published learning-library identifier while authorised content and assessment policy are confirmed.`;
  if (origin === "sourcecraft" && raw.template === "regional-pack") return `${title}: a preserved SourceCraft regional route. Regional notes await owner permission before migration.`;
  if (origin === "procuresherpa" && raw.path.includes("#")) return `${title}: a preserved ProcureSherpa hash route. Authorised content is required before the guide body can be migrated.`;
  if (origin === "learnpmo") return `${title}: an independently authored LearnPMO entry point. Workspace source, saved-state rules and authenticated behavior remain owner-gated.`;
  if (origin === "learn") return `${title}: find the relevant Digi Tracks learning path, its access boundary and the next practical step.`;
  const descriptions = {
    home: "Explore Digi Tracks operational software, learning tools and working applications, then request the right product or deployment conversation.",
    "product-index": `Browse ${products.length} Digi Tracks catalogue entries with clear licence, deployment and access boundaries.`,
    "solution-index": "Find Digi Tracks software by the work you do, from education and healthcare to procurement and recruitment.",
    "industry-index": "Explore operational software for education, healthcare, beauty and wellness, business operations, procurement and recruitment.",
    "capability-hub": "Compare the relevant Digi Tracks tools, their verified scope and the next practical evaluation step.",
    legal: "Read the Digi Tracks site terms, privacy information and accessibility commitment.",
    marketing: `Learn about ${title} and find a clear next step with Digi Tracks.`,
    "sourcecraft-index": "Search, save and organise procurement terminology with transparent editorial and offline-state boundaries.",
    "hcm-index": "Browse the HCM Fusion learning catalogue and its source, release and provenance boundaries.",
    "application-shell": "Use the local-first ProcureSherpa learning workspace or request qualified demo access."
  };
  return descriptions[raw.template] ?? `${title} on Digi Tracks.`;
}

function breadcrumbsFor(origin, routePath, title) {
  const pathname = routePath.split("#")[0];
  const segments = pathname.split("/").filter(Boolean);
  const items = [{ label: "Home", path: "/" }];
  const labels = { products: "Products", solutions: "Solutions", industries: "Industries", learn: "Learning", regions: "Regions", sources: "Sources", certifications: "Certifications", concepts: "Concepts", glossary: "Glossary", labs: "Labs", practice: "Practice", resources: "Resources", courses: "Courses", lessons: "Lessons", assessments: "Assessments", exports: "Exports", api: "API" };
  let current = "";
  for (const segment of segments) {
    current += `/${segment}`;
    items.push({ label: labels[segment] ?? humanize(segment), path: canonicalPath(origin, current) });
  }
  if (items.length > 1) items[items.length - 1] = { label: title.split(" | ")[0], path: routePath };
  return items;
}

function policyFor(origin, raw, routePath) {
  const baseline = Boolean(raw.sitemapMember);
  let indexable = baseline && raw.routeClass === "public-seo" && !routePath.includes("#");
  let contentStatus = indexable ? "approved" : raw.routeClass === "retired" ? "retired" : "blocked";
  if (origin === "sourcecraft") {
    if (raw.template === "term") {
      indexable = false;
      contentStatus = "in-review";
    } else if (raw.template === "regional-pack") {
      indexable = routePath === "/regions/";
      contentStatus = indexable ? "approved" : "blocked";
    } else {
      indexable = sourcecraftIndexable.has(routePath);
      contentStatus = indexable ? "approved" : "blocked";
    }
  }
  if (origin === "hcmfusion") {
    indexable = hcmIndexable.has(routePath);
    contentStatus = indexable ? "approved" : blockedHcmTemplates.has(raw.template) ? "blocked" : raw.routeClass === "retired" ? "retired" : "blocked";
  }
  if (origin === "procuresherpa" && routePath.includes("#")) {
    indexable = false;
    contentStatus = "blocked";
  }
  if (raw.routeClass !== "public-seo") indexable = false;
  return { indexable, contentStatus };
}

const rawRoutes = inventory.routes.filter((route) => originByHost[route.origin]);
const supplementalRoutes = [
  {
    origin: "portal",
    routePath: "/products/mindone-pro/",
    template: "product-detail",
    title: "MIND ONE Pro | Digi Tracks",
    description: "Review the planned complete MIND ONE edition and register qualified interest while entitlements, price and release timing remain unconfirmed.",
    contentKey: "mindone-pro",
    ctaIds: ["request-mindone-access"],
    breadcrumbs: [
      { label: "Home", path: "/" },
      { label: "Products", path: "/products/" },
      { label: "MIND ONE", path: "/products/mindone/" },
      { label: "MIND ONE Pro", path: "/products/mindone-pro/" }
    ]
  },
  {
    origin: "portal",
    routePath: "/products/mindone/compare/",
    template: "edition-comparison",
    title: "Compare MIND ONE and MIND ONE Pro | Digi Tracks",
    description: "Compare the published MIND ONE edition positioning and see which entitlements, prices, integrations and release details still require confirmation.",
    contentKey: "mindone-editions",
    ctaIds: ["compare-mindone-editions", "request-mindone-access"],
    breadcrumbs: [
      { label: "Home", path: "/" },
      { label: "Products", path: "/products/" },
      { label: "MIND ONE", path: "/products/mindone/" },
      { label: "Compare editions", path: "/products/mindone/compare/" }
    ]
  },
  {
    origin: "portal",
    routePath: "/services/",
    template: "services",
    title: "Implementation, migration & support | Digi Tracks",
    description: "Scope a product evaluation, implementation, migration or support engagement around the workflow, deployment constraints and evidence you need.",
    contentKey: "services",
    ctaIds: ["request-conversation"],
    breadcrumbs: [
      { label: "Home", path: "/" },
      { label: "Services", path: "/services/" }
    ]
  }
];
const routeOverrides = {
  "portal:/products/mindone/": {
    title: "MIND ONE | Résumé-grounded interview practice | Digi Tracks",
    description: "A pre-launch interview-practice product focused on résumé-grounded questions, answer-specific coaching and a structured debrief. Request current access and scope.",
    ctaIds: ["request-mindone-access", "compare-mindone-editions"]
  },
  "portal:/products/mindone-pro/": {
    ctaIds: ["request-mindone-access", "compare-mindone-editions"]
  },
  "portal:/procurement-software/": {
    template: "procurement-ecosystem",
    title: "Procurement software ecosystem | Digi Tracks",
    description: "Compare Vertex, Vantor, Procure5, Procure Sherpa and ProcureSherpa Learning by workflow, deployment and evidence—without treating them as one product.",
    contentKey: "procurement-ecosystem",
    ctaIds: ["explore-procurement", "request-procurement-demo"]
  },
  "learn:/procuresherpa/": {
    template: "procurement-learning",
    title: "ProcureSherpa Learning | Digi Tracks",
    description: "Build practical procurement capability through Academy modules, calculators, SOPs, checklists, templates, scenarios and locally saved work.",
    contentKey: "procuresherpa-learning",
    ctaIds: ["explore-learning-paths", "request-learning-access"]
  }
};
const canonicalByKey = new Map();
const aliases = [];
for (const raw of rawRoutes) {
  const origin = originByHost[raw.origin];
  const routePath = canonicalPath(origin, raw.path);
  const key = `${origin}:${routePath}`;
  const candidate = { raw, origin, routePath, key };
  const existing = canonicalByKey.get(key);
  if (!existing || (raw.sitemapMember && !existing.raw.sitemapMember)) {
    if (existing) aliases.push(existing);
    canonicalByKey.set(key, candidate);
  } else if (raw.path !== routePath || existing.raw.path !== existing.routePath) {
    aliases.push(candidate);
  }
}

for (const supplemental of supplementalRoutes) {
  const key = `${supplemental.origin}:${supplemental.routePath}`;
  canonicalByKey.set(key, {
    raw: {
      path: supplemental.routePath,
      routeClass: "public-seo",
      template: supplemental.template,
      sitemapMember: false,
      evidenceStatus: "addendum-authored"
    },
    origin: supplemental.origin,
    routePath: supplemental.routePath,
    key,
    supplemental
  });
}

const routes = [];
for (const { raw, origin, routePath, key, supplemental } of canonicalByKey.values()) {
  const product = origin === "portal" ? products.find((item) => item.route === routePath.replace(/\/$/, "")) : undefined;
  const override = routeOverrides[`${origin}:${routePath}`];
  const title = override?.title ?? supplemental?.title ?? routeTitle(origin, raw, routePath, product);
  const description = override?.description ?? supplemental?.description ?? routeDescription(origin, raw, title, product);
  const policy = supplemental
    ? { indexable: true, contentStatus: "approved" }
    : policyFor(origin, raw, routePath);
  const { indexable, contentStatus } = policy;
  const template = override?.template ?? raw.template;
  const hashRoute = routePath.includes("#");
  const hashParts = hashRoute ? routePath.split("#/")[1]?.split("/") ?? [] : [];
  const contentKey = override?.contentKey ?? supplemental?.contentKey ?? product?.id ?? (template === "term" ? `sourcecraft-term:${routePath.split("/").filter(Boolean).at(-1)}` : hashRoute ? `${hashParts[0]}:${hashParts.slice(1).join("/")}` : undefined);
  const ctaIds = override?.ctaIds ?? supplemental?.ctaIds ?? (template === "legal" ? ["contact"] : origin === "portal" && product ? ["request-product-demo", "request-quote"] : ["request-demo"]);
  routes.push({
    id: `${origin}:${product?.id ?? (hashRoute ? `${hashParts[0]}:${hashParts.slice(1).join("/")}` : routePath)}`,
    origin, path: routePath, routeClass: raw.routeClass, indexable, title, description,
    template, contentKey, breadcrumbs: supplemental?.breadcrumbs ?? breadcrumbsFor(origin, routePath, title),
    schema: indexable ? ["BreadcrumbList", ...(product ? ["SoftwareApplication"] : [])] : [],
    ctaIds, analyticsId: `route:${origin}:${shortHash(routePath)}`, canonicalOrigin: originHost[origin],
    baselineSitemap: Boolean(raw.sitemapMember), hashRoute, contentStatus,
    socialImage: indexable && !hashRoute ? socialCardPath(originHost[origin], routePath) : undefined,
    sourceStatus: raw.evidenceStatus,
    ...(origin === "learnpmo" && routePath === "/" ? { redirectTo: absoluteUrl(origin, "/dashboard/") } : {})
  });
}

for (const alias of aliases) {
  const target = routes.find((route) => route.origin === alias.origin && route.path === alias.routePath);
  if (!target || alias.raw.path === alias.routePath) continue;
  routes.push({
    id: `${alias.origin}:redirect:${alias.raw.path}`, origin: alias.origin, path: alias.raw.path, routeClass: "retired", indexable: false,
    title: "Redirecting", description: "This URL redirects to its canonical Digi Tracks route.", template: "redirect", contentKey: target.contentKey,
    breadcrumbs: [{ label: "Home", path: "/" }], schema: [], ctaIds: [], analyticsId: `redirect:${alias.origin}:${shortHash(alias.raw.path)}`,
    canonicalOrigin: originHost[alias.origin], redirectTo: absoluteUrl(alias.origin, alias.routePath), baselineSitemap: false,
    hashRoute: false, contentStatus: "retired", sourceStatus: alias.raw.evidenceStatus
  });
}

for (const route of [...routes]) {
  if (route.hashRoute || route.path === "/" || route.redirectTo) continue;
  const alternate = trailingSlash[route.origin] ? route.path.replace(/\/$/, "") : `${route.path}/`;
  if (routes.some((candidate) => candidate.origin === route.origin && candidate.path === alternate)) continue;
  routes.push({
    id: `${route.origin}:redirect:${alternate}`, origin: route.origin, path: alternate, routeClass: "retired", indexable: false,
    title: "Redirecting", description: "This URL redirects to its canonical Digi Tracks route.", template: "redirect",
    breadcrumbs: [{ label: "Home", path: "/" }], schema: [], ctaIds: [], analyticsId: `redirect:${route.origin}:${shortHash(alternate)}`,
    canonicalOrigin: originHost[route.origin], redirectTo: absoluteUrl(route.origin, route.path), baselineSitemap: false,
    hashRoute: false, contentStatus: "retired", sourceStatus: "generated-trailing-slash-policy"
  });
}

routes.sort((a, b) => a.origin.localeCompare(b.origin) || a.path.localeCompare(b.path));
writeTs("packages/seo/src/route-registry.generated.ts", "routeRegistry", routes);

const claimsInventory = JSON.parse(fs.readFileSync(path.join(root, "inventories/claims.json"), "utf8"));
const claims = claimsInventory.claims.map((claim) => ({
  id: claim.id, statement: claim.claim, status: claim.status,
  source: claim.evidence.map((evidence) => evidence.source).join("; "), verifiedAt: claim.verifiedAt ?? undefined, owner: claim.owner
}));
writeTs("packages/content/src/claims.generated.ts", "auditedClaims", claims);

const governedContent = routes
  .filter((route) => ["in-review", "blocked"].includes(route.contentStatus) && ["term", "regional-pack", "course", "lesson", "concept", "glossary-entry", "evidence-claim", "assessment", "certification-paper", "procedure", "scenario", "module-export", "hash-content-detail"].includes(route.template))
  .map((route) => ({
    id: route.contentKey ?? route.id, title: route.title,
    body: "Route identifier preserved. The underlying editorial content is not republished until owner permission and editorial approval are recorded.",
    editorialStatus: route.contentStatus === "in-review" ? "in_review" : "blocked",
    rightsStatus: "permission-required",
    provenance: { source: `inventories/routes.json:${route.origin}:${route.path}`, owner: "UNKNOWN — owner input required", licence: "All rights reserved; migration permission not supplied" },
    claimIds: route.origin === "sourcecraft" ? ["CLM-013", "CLM-014", "CLM-035"] : ["CLM-019", "CLM-024", "CLM-035", "CLM-036"]
  }));
writeTs("packages/content/src/content.generated.ts", "governedContent", governedContent);

const summary = {
  generatedAt,
  referenceSourceSha256: hash(source),
  catalogueEntries: products.length,
  sourceProducts: products.filter((product) => product.availability !== "request-only").length,
  sourceFlagships: products.filter((product) => product.availability !== "request-only" && !product.parentId).length,
  requestOnlyRoutes: products.filter((product) => product.availability === "request-only").length,
  prelaunchRoutes: products.filter((product) => product.availability === "request-only" && product.status.toLowerCase().includes("pre-launch")).length,
  nestedProducts: products.filter((product) => product.parentId).length,
  routes: routes.length,
  baselineSitemapRoutes: routes.filter((route) => route.baselineSitemap).length,
  indexableRoutes: routes.filter((route) => route.indexable).length,
  governedContent: governedContent.length
};
fs.writeFileSync(path.join(root, "inventories/generated-registry-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
