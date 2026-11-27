import {
  ANALYTICS_CTA_IDS,
  ANALYTICS_INTENTS,
  ANALYTICS_RESOURCE_IDS,
  BROWSER_ANALYTICS_EVENTS,
  type BrowserAnalyticsEvent,
} from "@digitracks/catalog/analytics";

declare global {
  interface ImportMetaEnv {
    readonly PUBLIC_LEAD_ENDPOINT?: string;
  }
}

export interface BrowserEventPayload {
  event: BrowserAnalyticsEvent;
  intent?: string;
  productId?: string;
  ctaId?: string;
  resourceId?: string;
}

interface BrowserEventContext {
  intent?: unknown;
  productId?: unknown;
  ctaId?: unknown;
  resourceId?: unknown;
}

const eventNames = new Set<string>(BROWSER_ANALYTICS_EVENTS);
const ctaIds = new Set<string>(ANALYTICS_CTA_IDS);
const resourceIds = new Set<string>(ANALYTICS_RESOURCE_IDS);
const intents = new Set<string>(ANALYTICS_INTENTS);

function allowedDimension(value: unknown, allowed: ReadonlySet<string>): string | undefined {
  return typeof value === "string" && allowed.has(value) ? value : undefined;
}

function productDimension(value: unknown): string | undefined {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,79}$/.test(value) ? value : undefined;
}

export function buildBrowserEvent(event: unknown, context: BrowserEventContext = {}): BrowserEventPayload | null {
  if (typeof event !== "string" || !eventNames.has(event)) return null;
  const name = event as BrowserAnalyticsEvent;
  const intent = allowedDimension(context.intent, intents);
  const productId = productDimension(context.productId);
  const ctaId = allowedDimension(context.ctaId, ctaIds);
  const resourceId = allowedDimension(context.resourceId, resourceIds);

  if ((name === "cta_click" || name === "demo_open") && !ctaId) return null;
  if (name === "demo_open" && intent !== "demo") return null;
  if (name === "resource_export" && !resourceId) return null;
  if ((name === "lead_start" || name === "lead_submit") && (context.ctaId || context.resourceId)) return null;

  return {
    event: name,
    ...(intent ? { intent } : {}),
    ...(productId ? { productId } : {}),
    ...(ctaId ? { ctaId } : {}),
    ...(resourceId ? { resourceId } : {}),
  };
}

export function isLoopbackHostname(hostname: string): boolean {
  let host = hostname.trim().toLowerCase();
  if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1);
  host = host.replace(/\.$/, "");
  if (host === "localhost" || host === "::1") return true;
  if (/^127(?:\.\d{1,3}){3}$/.test(host)) {
    return host.split(".").slice(1).every((octet) => Number(octet) <= 255);
  }
  if (!host.includes(":")) return false;

  try {
    const canonical = new URL(`http://[${host}]/`).hostname.slice(1, -1);
    if (canonical === "::1") return true;
    const mapped = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(canonical);
    if (!mapped) return false;
    const high = Number.parseInt(mapped[1], 16);
    return high >= 0x7f00 && high <= 0x7fff;
  } catch {
    return false;
  }
}

export function resolveLeadEndpoint(configured: string | undefined, pageHostname: string): string | undefined {
  const value = configured?.trim();
  if (!value) return undefined;

  const pageIsLoopback = isLoopbackHostname(pageHostname);

  try {
    const endpoint = new URL(value);
    const endpointIsLoopback = isLoopbackHostname(endpoint.hostname);
    if (endpoint.username || endpoint.password) return undefined;
    if (pageIsLoopback && !endpointIsLoopback) return undefined;
    if (!pageIsLoopback && (endpointIsLoopback || endpoint.protocol !== "https:")) return undefined;
    if (endpoint.protocol !== "https:" && !(pageIsLoopback && endpoint.protocol === "http:")) return undefined;
    return endpoint.toString();
  } catch {
    return undefined;
  }
}

function configuredEndpoint(): string | undefined {
  const endpoint = resolveLeadEndpoint(import.meta.env.PUBLIC_LEAD_ENDPOINT, window.location.hostname);
  if (!endpoint) return undefined;
  try {
    return new URL("/api/events", endpoint).toString();
  } catch {
    return undefined;
  }
}

function sendEvent(endpoint: string, payload: BrowserEventPayload): void {
  void fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "omit",
    cache: "no-store",
    keepalive: true,
    redirect: "error",
    referrerPolicy: "no-referrer",
  }).catch(() => undefined);
}

function linkContext(link: HTMLAnchorElement): BrowserEventContext {
  try {
    const target = new URL(link.href, window.location.href);
    if (target.origin !== window.location.origin) return {};
    return {
      intent: target.searchParams.get("intent") ?? undefined,
      productId: target.searchParams.get("product") ?? undefined,
    };
  } catch {
    return {};
  }
}

function formContext(form: HTMLFormElement): BrowserEventContext {
  return {
    intent: form.dataset.leadIntent,
    productId: form.dataset.leadProduct,
  };
}

export function installAnalyticsBridge(): () => void {
  const endpoint = configuredEndpoint();
  if (!endpoint) return () => undefined;

  const startedForms = new WeakSet<HTMLFormElement>();
  const emit = (payload: BrowserEventPayload | null) => {
    if (payload) sendEvent(endpoint, payload);
  };
  const onClick = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const resource = event.target.closest<HTMLElement>("[data-analytics-event]");
    if (resource) {
      emit(buildBrowserEvent(resource.dataset.analyticsEvent, { resourceId: resource.dataset.resourceId }));
      return;
    }

    const cta = event.target.closest<HTMLElement>("[data-cta]");
    if (!cta) return;
    const ctaId = cta.dataset.cta;
    const link = cta instanceof HTMLAnchorElement ? cta : cta.closest<HTMLAnchorElement>("a");
    const context = link ? linkContext(link) : {};
    emit(buildBrowserEvent("cta_click", { ...context, ctaId }));
    if ((ctaId === "request-demo" || ctaId === "request-product-demo") && context.intent === "demo") {
      emit(buildBrowserEvent("demo_open", { ...context, ctaId }));
    }
  };
  const onFocusIn = (event: FocusEvent) => {
    if (!(event.target instanceof Element)) return;
    const form = event.target.closest<HTMLFormElement>("[data-lead-form]");
    if (!form || startedForms.has(form)) return;
    startedForms.add(form);
    emit(buildBrowserEvent("lead_start", formContext(form)));
  };
  const onSubmit = (event: SubmitEvent) => {
    if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-lead-form]")) return;
    emit(buildBrowserEvent("lead_submit", formContext(event.target)));
  };

  document.addEventListener("click", onClick, true);
  document.addEventListener("focusin", onFocusIn, true);
  document.addEventListener("submit", onSubmit, true);
  return () => {
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("focusin", onFocusIn, true);
    document.removeEventListener("submit", onSubmit, true);
  };
}
