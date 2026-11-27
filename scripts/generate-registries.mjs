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
    ? "unknown"
    : "proprietary";
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
    audience: `Teams buying ${product.category.toLowerCase()} software`,
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
    summary: "One education ecosystem across school, college, university, community and placement",
    description: "Vedik is a portfolio of education products rather than a single application. It brings together Vedik School, Unnati College, Vedik University, Vedik Social Community, Campus Grid and related mobile or community initiatives around one education mission. Each product retains its own deployment, identity, integration and readiness boundary.",
    audience: "School, college and university leaders, education operations teams, placement cells and student communities",
    capabilities: [
      "Vedik School operations across learners, academics, fees and administration",
      "Unnati College workflows for higher-education institutions",
      "Vedik University and institutional administration initiatives",
      "Vedik Social Community for education-focused community workflows",
      "Campus Grid placement drives, eligibility and offer tracking",
      "Related Android and education/community initiatives",
      "Product-level evaluation across deployment, identity and integration needs",
      "Public School ERP demonstration with sample data"
    ],
    platforms: ["Web", "Android (evaluation)"],
    availability: "request-only",
    deployment: "Portfolio of independently deployed products; shared deployment is not verified",
    status: "Portfolio / product-level readiness varies",
    evidenceStatus: "mixed",
    evidenceNote: "The public School demo uses sample data. Product-level deployment, identity, integration and release readiness vary; a common production platform, shared SSO and uniform readiness are not established.",
    industryIds: ["education"],
    claims: [{ id: "CLM-002", status: "verified" }, { id: "CLM-038", status: "verified" }, { id: "CLM-044", status: "verified" }]
  },
  "campus-grid": {
    parentId: "vedik",
    summary: "Placement drives, eligibility rules and offer tracking for campuses",
    description: "Campus Grid is the placement product in the Vedik education portfolio. It supports institution, student and employer workflows across drives, applications, assessments, interviews, offers and joining, with deterministic fail-closed eligibility and CSV V1 ERP import/export. Production deployment and API, webhook or scheduled synchronization require evaluation.",
    audience: "Training and placement officers, institution administrators, students and recruiting employers",
    capabilities: [
      "Institution, student and employer consoles",
      "Placement drives, applications and assessments",
      "Interview scheduling, offers and joining records",
      "Deterministic fail-closed eligibility rules",
      "Audit history and placement reporting",
      "CSV V1 ERP import and export",
      "Planned REST, webhook and scheduled synchronization"
    ],
    platforms: ["Web"],
    availability: "request-only",
    deployment: "Self-hosted evaluation; production environment verification pending",
    status: "Local workflow checks reported / production verification pending",
    evidenceStatus: "code-backed",
    evidenceNote: "Reported local workflow checks cover core workflows and CSV V1 exchange. They do not prove production-environment readiness or completed ERP API synchronization.",
    industryIds: ["education", "recruitment"],
    claims: [{ id: "CLM-002", status: "verified" }, { id: "CLM-038", status: "verified" }, { id: "CLM-045", status: "verified" }]
  },
  "vedik-school-erp": {
    name: "Vedik School",
    summary: "School operations, academics, fees and administration",
    description: "Vedik School covers learner records, admissions, fees, attendance, timetables, examinations, transport, library and school administration. A public demonstration uses sample data. Production readiness and web/mobile schema alignment require evaluation before deployment.",
    audience: "School leaders, administrators, teachers and operations teams",
    availability: "request-only",
    deployment: "Independent web and Android products; schema alignment requires verification",
    status: "Production evaluation / sample-data demonstration available",
    evidenceStatus: "mixed",
    evidenceNote: "The public School ERP demonstration is observable with sample data. Production release readiness and synchronized web/mobile schemas are not established.",
    claims: [{ id: "CLM-002", status: "verified" }, { id: "CLM-005", status: "verified" }, { id: "CLM-038", status: "verified" }, { id: "CLM-044", status: "verified" }]
  },
  unnati: {
    name: "Unnati College",
    summary: "College admissions, academics, examinations and administration",
    description: "Unnati extends the Vedik portfolio into higher education with admissions, departmental workflows, examinations, progression, fees, faculty workload and reporting. A controlled single-institution pilot is the proposed evaluation path; unrestricted production release is not established.",
    audience: "College leaders, administrators, faculty and academic operations teams",
    availability: "request-only",
    deployment: "Independent deployment; controlled single-institution pilot scope requires confirmation",
    status: "Conditional controlled single-institution pilot",
    evidenceStatus: "code-backed",
    evidenceNote: "Documented workflow scope supports evaluation for a controlled single-institution pilot. Production rollout, support and integration readiness require separate confirmation.",
    claims: [{ id: "CLM-002", status: "verified" }, { id: "CLM-005", status: "verified" }, { id: "CLM-044", status: "verified" }]
  },
  "vedik-university": {
    name: "Vedik University",
    summary: "Higher-education administration across the institutional lifecycle",
    description: "Vedik University is the university-level initiative in the Vedik education portfolio, covering admissions, academics, examinations, finance, HR, research and campus operations. Startup and schema readiness require verification before production deployment.",
    audience: "University leaders, registrars, administrators and campus operations teams",
    availability: "request-only",
    deployment: "Independent self-hosted product; production deployment not verified",
    status: "Production evaluation / startup and schema verification required",
    evidenceStatus: "code-backed",
    evidenceNote: "The intended institutional scope is documented. Startup and schema readiness require verification; no production-readiness claim is made.",
    claims: [{ id: "CLM-002", status: "verified" }, { id: "CLM-005", status: "verified" }, { id: "CLM-044", status: "verified" }]
  },
  "vedik-social": {
    name: "Vedik Social Community",
    summary: "Education-focused campus community, clubs, events and consent workflows",
    description: "Vedik Social Community supports campus feeds, clubs, events, student portfolios, parent oversight and consent-aware community workflows. A conditional pilot is the proposed evaluation path; safety, moderation, deployment and compliance claims still require product-level evaluation.",
    audience: "Schools, colleges, student communities and community administrators",
    availability: "request-only",
    deployment: "Independent hosted product; controlled pilot conditions require confirmation",
    status: "Conditional pilot / safety and deployment evaluation required",
    evidenceStatus: "code-backed",
    evidenceNote: "Documented community workflows support a conditional pilot discussion. Uniform deployment readiness and completed compliance assurance are not established.",
    claims: [{ id: "CLM-002", status: "verified" }, { id: "CLM-005", status: "verified" }, { id: "CLM-044", status: "verified" }]
  },
  orion: {
    summary: "Local-first code intelligence and static security analysis",
    description: "Orion is a proprietary, local-first code intelligence and static audit tool for engineering and security teams. It inspects source locally and supports review workflows without requiring a hosted runtime. Scanner totals and README benchmark figures are not published here because they change between source and release and were not independently reproduced.",
    audience: "Developers, security engineers and reviewers who need traceable local source analysis",
    capabilities: [
      "Local-first source inspection",
      "Static code and security analysis",
      "Review-oriented findings and evidence",
      "CLI and Python-source workflows",
      "Proprietary licence boundary"
    ],
    status: "Public preview / release scope varies",
    evidenceStatus: "code-backed",
    evidenceNote: "Current source and latest published release differ. Engine totals and benchmark claims were not independently verified.",
    claims: [{ id: "CLM-002", status: "verified" }, { id: "CLM-011", status: "site-stated" }, { id: "CLM-046", status: "verified" }, { id: "CLM-047", status: "verified" }]
  },
  "orion-hunter": {
    summary: "Evidence-first security reasoning and attack-path analysis",
    description: "Orion Hunter is an independent proprietary security reasoning platform. It combines a knowledge graph, attack paths, risk and compliance analysis, cases and remediation tracking with a local SQLite store, HTTP API and React portal. It is not an Orion edition, and its tracked component count must not be read as a count of independent scanners.",
    audience: "Security teams, analysts and reviewers who need graph-based investigation and remediation context",
    capabilities: [
      "Security knowledge graph and attack paths",
      "Risk, compliance and case workflows",
      "Remediation tracking and evidence context",
      "Local SQLite persistence",
      "HTTP API and React portal"
    ],
    status: "Request access / implementation scope under evaluation",
    availability: "request-only",
    evidenceStatus: "code-backed",
    evidenceNote: "Documented implementation scope covers the stated workflows. No shared runtime or integration with Orion, Recon or OpsPilot is claimed.",
    claims: [{ id: "CLM-002", status: "verified" }, { id: "CLM-046", status: "verified" }, { id: "CLM-047", status: "verified" }]
  },
  recon: {
    summary: "Local-first agentic SDLC with evidence, approvals and rollback",
    description: "Recon is an independent local-first AI engineering cockpit for software delivery. It combines a model gateway with human approvals, worktrees, checkpoints, validation and rollback around SQLite evidence. Local models can keep source on the machine; configured hosted models may receive the context sent to them, so absolute zero-code-egress wording is not used.",
    audience: "Engineering teams and developers who need reviewable AI-assisted delivery with operational controls",
    capabilities: [
      "Evidence-backed engineering sessions",
      "Human approval checkpoints",
      "Git worktrees and change checkpoints",
      "Validation and rollback workflows",
      "Configurable local or hosted model gateway",
      "Go/Wails desktop backend and React interface"
    ],
    status: "Public documentation / request implementation access",
    availability: "request-only",
    licenseModel: "proprietary",
    licenceNote: "Proprietary Digi Tracks licence; free to install for permitted internal executable use. It is not open source.",
    evidenceStatus: "code-backed",
    evidenceNote: "The stated workflow is documented for evaluation. Hosted-model context handling depends on provider configuration; production implementation and release readiness require evaluation.",
    claims: [{ id: "CLM-002", status: "verified" }, { id: "CLM-009", status: "verified" }, { id: "CLM-046", status: "verified" }, { id: "CLM-047", status: "verified" }]
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
  opspilot: {
    summary: "Local project operations, process control and diagnostics",
    description: "OpsPilot includes a project-operations CLI and desktop tool. It scans projects, plans startup order, controls processes and ports, and supports Docker, database, diagnostics, drift and doctor-check workflows. The published @ops_pilot/cli package is Apache-2.0; licensing for the desktop components remains unconfirmed. It is not an AI product and no Orion, Hunter or Recon integration is verified.",
    audience: "Developers and operations teams managing local services, ports, databases and startup workflows",
    capabilities: [
      "Project scanning and startup plans",
      "Process, service and port control",
      "Startup ordering and dependency checks",
      "Docker and database workflows",
      "Diagnostics, drift and doctor checks",
      "Rust CLI and Tauri desktop application"
    ],
    licenseModel: "unknown",
    licenseEvidence: undefined,
    licenceNote: "The published @ops_pilot/cli package is Apache-2.0. Licensing for the desktop components remains unconfirmed.",
    evidenceStatus: "mixed",
    evidenceNote: "The published CLI package has an Apache-2.0 licence. Desktop-component licensing and cross-product integrations remain unconfirmed.",
    claims: [{ id: "CLM-002", status: "verified" }, { id: "CLM-008", status: "verified" }, { id: "CLM-046", status: "verified" }]
  },
  vantor: {
    summary: "Self-hostable procurement operating system",
    description: "Vantor is a self-hostable procurement operating system spanning suppliers, sourcing, contracts, purchasing, spend and governed AI-assisted workflows. It runs on a local SQLite option or a multi-tenant Postgres deployment, with deployment, support, licence terms and AI behaviour agreed with the Vantor team during rollout.",
    audience: "Procurement, finance, legal, audit and platform teams choosing a self-hosted system",
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
  id: "mindone", name: "MIND ONE Basic", summary: "Free, focused interview practice with answer-specific coaching",
  description: "MIND ONE Basic is the free, focused entry position in the MIND ONE family. It covers résumé- and job-description-grounded practice, spoken or typed answers, answer-specific coaching and a structured debrief. MIND ONE Complete expands the experience with durable history and progress tools. Access remains request-only during pre-launch while released quotas and entitlement rules are confirmed.",
  audience: "Interview candidates, career changers and people practising competency-based interviews",
  category: "Education", licenseModel: "proprietary", buyingModel: "free",
  availability: "request-only", requestable: true, edition: "Basic edition",
  claims: [{ id: "CLM-004", status: "site-stated" }, { id: "CLM-037", status: "site-stated" }, { id: "CLM-042", status: "site-stated" }],
  assetIds: [], capabilities: [
    "Résumé and job-description-grounded practice questions",
    "Browser speech input with typed fallback",
    "Answer-specific coaching and model-answer rewriting",
    "Prioritised debrief tips and a drill sheet",
    "Local-only default with optional hosted AI by explicit consent",
    "Focused in-memory practice sessions"
  ],
  platforms: [], deployment: "Pre-launch; deployment and provider details require confirmation",
  status: "Pre-launch / free access by request", route: "/products/mindone", evidenceStatus: "mixed",
  evidenceNote: "The practice workflow is documented for evaluation. Free-tier positioning is owner-stated; released quotas, access controls and launch availability remain unconfirmed.",
  industryIds: ["education", "recruitment"]
};
const mindOneIndex = products.findIndex((product) => product.id === mindOneRecord.id);
if (mindOneIndex >= 0) products[mindOneIndex] = mindOneRecord;
else products.push(mindOneRecord);

const mindOneCompleteRecord = {
  id: "mindone-pro", name: "MIND ONE Complete", summary: "Full MIND ONE feature access with durable practice history and progress tools",
  description: "MIND ONE Complete is the full-feature position in the MIND ONE family. Its implemented scope adds durable local profiles and sessions, saved history, résumé/JD comparison, learning goals, progress tracking, role-development maps, source-attributed opportunity research, app lock and diagnostics. Access remains request-only during pre-launch; full feature access does not mean unmetered hosted AI, released billing or a confirmed launch date.",
  audience: "Candidates and organisations seeking the complete MIND ONE experience",
  category: "Education", licenseModel: "proprietary", buyingModel: "unknown",
  availability: "request-only", requestable: true, parentId: "mindone", edition: "Complete edition",
  claims: [{ id: "CLM-004", status: "site-stated" }, { id: "CLM-037", status: "site-stated" }, { id: "CLM-042", status: "site-stated" }, { id: "CLM-043", status: "verified" }],
  assetIds: [], capabilities: [
    "The complete MIND ONE practice and coaching workflow",
    "Durable local profiles and saved practice history",
    "Résumé and job-description comparison",
    "Learning goals and progress tracking",
    "Role-development maps",
    "Source-attributed remote opportunity listings",
    "App lock and diagnostics",
    "Provider and fair-use limits remain explicit"
  ],
  platforms: [], deployment: "Pre-launch; deployment details require confirmation",
  status: "Pre-launch / request only", route: "/products/mindone-pro", evidenceStatus: "code-backed",
  evidenceNote: "The documented Complete scope includes durable local history and progress tools. It does not prove released commercial entitlement, billing, integration, provider terms, unmetered usage or public launch availability.",
  industryIds: ["education", "recruitment"]
};
const mindOneCompleteIndex = products.findIndex((product) => product.id === mindOneCompleteRecord.id);
if (mindOneCompleteIndex >= 0) products[mindOneCompleteIndex] = mindOneCompleteRecord;
else products.push(mindOneCompleteRecord);

const solutions = [
  {
    id: "education",
    name: "Education & Academics",
    summary: "One education portfolio for institutions, placement teams and candidates.",
    audience: "School, college and university administrators, placement cells, student communities, candidates and career changers",
    challenge: "Education institutions need operational products across school, college, university, community and placement workflows, while candidates need focused interview practice. Vedik provides one portfolio identity without pretending every product shares one deployment or identity system.",
    workflow: [
      { title: "Map the education journey", description: "Identify the School, Unnati, University, Community or Campus Grid workflow that needs evaluation." },
      { title: "Review the product boundary", description: "Compare product-level deployment, readiness, identity and integration requirements rather than assuming one shared platform." },
      { title: "Choose the next conversation", description: "Request an institution or placement evaluation, or review MIND ONE Basic and Complete for candidate practice." }
    ],
    outcomes: ["A product-level education portfolio map", "A qualified institution or placement evaluation", "A separate candidate-practice access request"],
    productIds: ["vedik", "campus-grid", "mindone", "mindone-pro"],
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
  { id: "developer-tools", name: "Developer & Security Tools", summary: "Four independent tools for code intelligence, security reasoning, project operations and evidence-backed engineering delivery.", toolIds: ["orion", "orion-hunter", "opspilot", "recon"] },
  { id: "field-operations", name: "Projects, Sites & Logistics", summary: "Project, site, fleet, route, driver and freight operations. Construction and Transportation are self-hosted tools for site and fleet teams.", toolIds: ["construction", "transportation"] }
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
  if (raw.template === "term") return `${title}: a working procurement and contract reference from SourceCraft.`;
  if (origin === "hcmfusion") return `${title}: an HCM Fusion learning route for Oracle Fusion Cloud HCM processes and configuration.`;
  if (origin === "sourcecraft" && raw.template === "regional-pack") return `${title}: SourceCraft regional reference for procurement and contract language.`;
  if (origin === "procuresherpa" && raw.path.includes("#")) return `${title}: a ProcureSherpa learning guide on procurement practice.`;
  if (origin === "learnpmo") return `${title}: a LearnPMO academy route for project, programme and portfolio delivery.`;
  if (origin === "learn") {
    const learning = {
      "/": "Four public learning platforms — SourceCraft, LearnPMO, ProcureSherpa and HCM Fusion — each opened directly in the browser.",
      "/sourcecraft": "SourceCraft: procurement and contract language explained plainly, with regional reference lenses and saved terms.",
      "/learnpmo": "LearnPMO: PM360 Academy lessons, mock exams and a practice simulator for project, programme and portfolio delivery.",
      "/procuresherpa": "ProcureSherpa Learning: academy modules, calculators, SOPs, checklists and scenarios for procurement practice.",
      "/hcmfusion": "HCM Fusion: HCM Studio lessons and practice labs across Oracle Fusion Cloud HCM modules."
    };
    const key = raw.path.replace(/\/$/, "") || "/";
    return learning[key] ?? `${title}: a Digi Tracks learning page.`;
  }
  const descriptions = {
    home: "Explore Digi Tracks operational software, learning tools and working applications, then request the right product or deployment conversation.",
    "product-index": `Browse ${products.length} Digi Tracks catalogue entries with clear licence, deployment and access boundaries.`,
    "solution-index": "Find Digi Tracks software by the work you do, from education and healthcare to procurement and recruitment.",
    "industry-index": "Explore operational software for education, healthcare, beauty and wellness, business operations, procurement and recruitment.",
    "capability-hub": "Compare the relevant Digi Tracks tools, their scope and the next practical step.",
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
    title: "MIND ONE Complete | Full interview-practice experience | Digi Tracks",
    description: "Review MIND ONE Complete's implemented history, progress and role-development scope, then request pre-launch access while commercial terms and provider limits remain unconfirmed.",
    contentKey: "mindone-pro",
    ctaIds: ["request-mindone-access"],
    breadcrumbs: [
      { label: "Home", path: "/" },
      { label: "Products", path: "/products/" },
      { label: "MIND ONE", path: "/products/mindone/" },
      { label: "MIND ONE Complete", path: "/products/mindone-pro/" }
    ]
  },
  {
    origin: "portal",
    routePath: "/products/mindone/compare/",
    template: "edition-comparison",
    title: "Compare MIND ONE Basic and Complete | Digi Tracks",
    description: "Compare MIND ONE Basic's free focused workflow with Complete's implemented history, progress and role-development scope, with pricing, quotas and release status kept explicit.",
    contentKey: "mindone-editions",
    ctaIds: ["compare-mindone-editions", "request-mindone-access"],
    breadcrumbs: [
      { label: "Home", path: "/" },
      { label: "Products", path: "/products/" },
      { label: "MIND ONE", path: "/products/mindone/" },
      { label: "Compare Basic and Complete", path: "/products/mindone/compare/" }
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
    title: "MIND ONE Basic | Free focused interview practice | Digi Tracks",
    description: "MIND ONE Basic is the free, focused entry edition for résumé-grounded questions, spoken or typed answers, coaching and debriefs. Request pre-launch access and current scope.",
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
  id: claim.id, statement: claim.safePublicationWording ?? claim.claim, status: claim.status,
  source: `inventories/claims.json#${claim.id}`, verifiedAt: claim.verifiedAt ?? undefined, owner: claim.owner
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
