import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { resolveLeadEndpoint } from "../lib/analytics";

declare global {
  interface ImportMetaEnv {
    readonly PUBLIC_LEAD_ENDPOINT?: string;
    readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export const LEAD_INTENTS = [
  "product-enquiry",
  "demo",
  "consultation",
  "migration",
  "support",
  "partnership",
  "learning",
] as const;

export type LeadIntent = (typeof LEAD_INTENTS)[number];

export interface LeadProductOption {
  id: string;
  name: string;
  demoEligible: boolean;
}

export interface LeadFormProps {
  products: readonly LeadProductOption[];
  initialIntent?: LeadIntent;
  initialProductId?: string | null;
}

type FormPhase = "idle" | "submitting" | "received" | "error";
type ChallengeStatus = "idle" | "loading" | "ready" | "expired" | "error";
type EditableField = "intent" | "name" | "email" | "organization" | "productId" | "message" | "consent" | "honeypot";
type VisibleField = Exclude<EditableField, "honeypot">;
type FieldErrors = Partial<Record<VisibleField, string>>;

interface LeadFields {
  intent: LeadIntent;
  name: string;
  email: string;
  organization: string;
  productId: string;
  message: string;
  consent: boolean;
  honeypot: string;
}

interface LeadPayload {
  intent: LeadIntent;
  name: string;
  email: string;
  organization: string | null;
  productId: string | null;
  page: string;
  message: string;
  consent: true;
  honeypot: string;
  locale: string;
  turnstileToken: string;
}

interface TurnstileRenderOptions {
  sitekey: string;
  action: "lead";
  theme: "light";
  size: "flexible";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

type TurnstileWindow = Window & { turnstile?: TurnstileApi };

const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const visibleFieldOrder: readonly VisibleField[] = ["intent", "name", "email", "organization", "productId", "message", "consent"];
let turnstileLoader: Promise<TurnstileApi> | undefined;

const intentOptions: readonly { value: LeadIntent; label: string }[] = [
  { value: "product-enquiry", label: "Product enquiry or licensing" },
  { value: "demo", label: "Product demo" },
  { value: "consultation", label: "General consultation" },
  { value: "migration", label: "Migration planning" },
  { value: "support", label: "Product support" },
  { value: "partnership", label: "Partnership" },
  { value: "learning", label: "Learning enquiry" },
];

const serverFieldErrors: Record<string, string> = {
  intent: "Choose a valid enquiry type.",
  name: "Enter a name between 1 and 120 characters.",
  email: "Enter a valid email address.",
  organization: "Organization must be 160 characters or fewer.",
  productId: "Choose a valid catalogue product.",
  message: "Enter a message between 1 and 4,000 characters.",
  consent: "Consent is required before an enquiry can be submitted.",
};

const serverContextErrors: Record<string, string> = {
  page: "This page URL could not be verified. Refresh the page and try again.",
  locale: "The browser locale could not be verified. Please try again.",
  turnstileToken: "Bot verification is missing or invalid. Complete the check again before retrying.",
};

export function isLeadIntent(value: string | null | undefined): value is LeadIntent {
  return typeof value === "string" && (LEAD_INTENTS as readonly string[]).includes(value);
}

function loadTurnstile(): Promise<TurnstileApi> {
  const browserWindow = window as TurnstileWindow;
  if (browserWindow.turnstile?.render) return Promise.resolve(browserWindow.turnstile);
  if (turnstileLoader) return turnstileLoader;

  turnstileLoader = new Promise<TurnstileApi>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>('script[data-digitracks-turnstile="true"]');
    const timeoutId = window.setTimeout(() => {
      cleanup();
      turnstileLoader = undefined;
      reject(new Error("turnstile_load_timeout"));
    }, 12_000);

    function cleanup() {
      window.clearTimeout(timeoutId);
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    }

    function fail() {
      cleanup();
      script?.remove();
      turnstileLoader = undefined;
      reject(new Error("turnstile_load_failed"));
    }

    function handleLoad() {
      cleanup();
      const api = (window as TurnstileWindow).turnstile;
      if (api?.render) resolve(api);
      else fail();
    }

    function handleError() {
      fail();
    }

    if (!script) {
      script = document.createElement("script");
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.dataset.digitracksTurnstile = "true";
    }
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    if (!script.isConnected) document.head.append(script);
  });

  return turnstileLoader;
}

function validateFields(fields: LeadFields, demoProductIds: ReadonlySet<string>): FieldErrors {
  const errors: FieldErrors = {};
  if (!isLeadIntent(fields.intent)) errors.intent = "Choose a valid enquiry type.";
  if (!fields.name.trim()) errors.name = "Enter your name.";
  else if (fields.name.trim().length > 120) errors.name = "Name must be 120 characters or fewer.";
  if (!fields.email.trim()) errors.email = "Enter your email address.";
  else if (fields.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(fields.email.trim())) errors.email = "Enter a valid email address.";
  if (fields.organization.trim().length > 160) errors.organization = "Organization must be 160 characters or fewer.";
  if (fields.intent === "demo" && !demoProductIds.has(fields.productId)) errors.productId = "Choose a demo-eligible catalogue product for the demo request.";
  if (!fields.message.trim()) errors.message = "Tell us what you need.";
  else if (fields.message.trim().length > 4_000) errors.message = "Message must be 4,000 characters or fewer.";
  if (!fields.consent) errors.consent = "Consent is required before an enquiry can be submitted.";
  if (fields.honeypot.length > 256) errors.message = "The request could not be accepted. Please try again.";
  return errors;
}

function currentLocale(): string {
  const locale = (navigator.language || "en").replaceAll("_", "-").toLowerCase();
  return /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/u.test(locale) ? locale : "en";
}

async function readResponseJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await response.json();
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export default function LeadForm({ products, initialIntent = "consultation", initialProductId = null }: LeadFormProps) {
  const formId = useId();
  const publicProductIds = useMemo(() => new Set(products.map((product) => product.id)), [products]);
  const demoProductIds = useMemo(() => new Set(products.filter((product) => product.demoEligible).map((product) => product.id)), [products]);
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const pendingRef = useRef(false);
  const [fields, setFields] = useState<LeadFields>(() => ({
    intent: initialIntent,
    name: "",
    email: "",
    organization: "",
    productId: initialProductId && publicProductIds.has(initialProductId) ? initialProductId : "",
    message: "",
    consent: false,
    honeypot: "",
  }));
  const [phase, setPhase] = useState<FormPhase>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [receiptId, setReceiptId] = useState<string | undefined>(undefined);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [challengeStatus, setChallengeStatus] = useState<ChallengeStatus>("idle");
  const [challengeNotice, setChallengeNotice] = useState("");
  const [challengeAttempt, setChallengeAttempt] = useState(0);
  const [urlStateReady, setUrlStateReady] = useState(false);
  const [endpoint, setEndpoint] = useState<string>();

  const configuredEndpoint = import.meta.env.PUBLIC_LEAD_ENDPOINT?.trim();
  const siteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const configured = Boolean(configuredEndpoint && siteKey);
  const deliveryConfigured = Boolean(endpoint && siteKey);
  const localDeliveryBlocked = Boolean(configuredEndpoint && urlStateReady && !endpoint);
  const pending = phase === "submitting";
  const canSubmit = deliveryConfigured && urlStateReady && challengeStatus === "ready" && Boolean(turnstileToken) && !pending && phase !== "received";
  const selectedIntentLabel = intentOptions.find((option) => option.value === fields.intent)?.label ?? "General consultation";
  const selectedProductName = products.find((product) => product.id === fields.productId)?.name;
  const demoSelectionBlocked = Boolean(fields.productId && !demoProductIds.has(fields.productId));
  const emailFallbackHref = `mailto:contact@digitracks.net?subject=${encodeURIComponent(`Digi Tracks — ${selectedIntentLabel}`)}&body=${encodeURIComponent([
    `Enquiry type: ${selectedIntentLabel}`,
    selectedProductName ? `Product: ${selectedProductName}` : "",
    "",
    "Please describe your workflow, current tools, deployment constraints and who needs to be involved.",
    "",
    "Do not include passwords, confidential records or unnecessary personal data."
  ].filter(Boolean).join("\n"))}`;

  useLayoutEffect(() => {
    setEndpoint(resolveLeadEndpoint(configuredEndpoint, window.location.hostname));
    const params = new URLSearchParams(window.location.search);
    const requestedIntent = params.get("intent");
    const requestedProductId = params.get("product");
    setFields((current) => {
      const next = { ...current };
      if (isLeadIntent(requestedIntent)) next.intent = requestedIntent;
      if (requestedProductId && publicProductIds.has(requestedProductId)) next.productId = requestedProductId;
      if (next.intent === "demo" && next.productId && !demoProductIds.has(next.productId)) next.intent = "product-enquiry";
      return next;
    });
    setUrlStateReady(true);
  }, [configuredEndpoint, demoProductIds, publicProductIds]);

  useEffect(() => {
    if (!deliveryConfigured || !endpoint || !siteKey) return;
    let active = true;
    widgetIdRef.current = undefined;
    setTurnstileToken("");
    setChallengeStatus("loading");
    setChallengeNotice("Loading bot verification…");

    loadTurnstile().then((api) => {
      if (!active || !turnstileContainerRef.current) return;
      const widgetId = api.render(turnstileContainerRef.current, {
        sitekey: siteKey,
        action: "lead",
        theme: "light",
        size: "flexible",
        callback: (token) => {
          if (!active) return;
          setTurnstileToken(token);
          setChallengeStatus("ready");
          setChallengeNotice("Bot verification complete. Your enquiry has not been submitted yet.");
        },
        "expired-callback": () => {
          if (!active) return;
          setTurnstileToken("");
          setChallengeStatus("expired");
          setChallengeNotice("Bot verification expired. Complete the check again before submitting.");
        },
        "error-callback": () => {
          if (!active) return;
          setTurnstileToken("");
          setChallengeStatus("error");
          setChallengeNotice("Bot verification could not be completed. Submission is disabled until verification is retried.");
        },
      });
      widgetIdRef.current = widgetId;
    }).catch(() => {
      if (!active) return;
      setChallengeStatus("error");
      setChallengeNotice("Bot verification could not be loaded. Submission is disabled. Check your connection or content blocker, then retry.");
    });

    return () => {
      active = false;
      const widgetId = widgetIdRef.current;
      if (widgetId !== undefined) {
        widgetIdRef.current = undefined;
        try {
          (window as TurnstileWindow).turnstile?.remove(widgetId);
        } catch {
          // The original page state is more important than widget cleanup failures.
        }
      }
    };
  }, [challengeAttempt, deliveryConfigured, endpoint, siteKey]);

  function updateField<K extends EditableField>(field: K, value: LeadFields[K]) {
    setFields((current) => {
      if (field === "intent" && value === "demo" && current.productId && !demoProductIds.has(current.productId)) return current;
      if (field === "productId" && current.intent === "demo" && typeof value === "string" && value && !demoProductIds.has(value)) {
        return { ...current, productId: value, intent: "product-enquiry" };
      }
      return { ...current, [field]: value };
    });
    setErrors((current) => {
      const next = { ...current };
      if (field !== "honeypot") delete next[field as VisibleField];
      if (field === "productId") delete next.intent;
      return next;
    });
  }

  function describedBy(field: VisibleField, hintId?: string) {
    const ids = [hintId, errors[field] ? `${formId}-${field}-error` : undefined].filter(Boolean);
    return ids.length ? ids.join(" ") : undefined;
  }

  function inlineError(field: VisibleField) {
    return errors[field] ? <p className="field__error" id={`${formId}-${field}-error`}>{errors[field]}</p> : null;
  }

  function focusFirstError(nextErrors: FieldErrors) {
    for (const field of visibleFieldOrder) {
      if (!nextErrors[field]) continue;
      const control = formRef.current?.elements.namedItem(field);
      if (control instanceof HTMLElement) {
        control.focus();
        break;
      }
    }
  }

  function resetVerification() {
    setTurnstileToken("");
    setChallengeStatus("ready");
    setChallengeNotice("Complete the bot check again before retrying.");
    const widgetId = widgetIdRef.current;
    if (widgetId !== undefined) {
      try {
        (window as TurnstileWindow).turnstile?.reset(widgetId);
      } catch {
        // Keep the original request error visible if the widget cannot reset.
      }
    }
  }

  function failRequest(message: string, nextErrors: FieldErrors = {}) {
    setErrors(nextErrors);
    setErrorMessage(message);
    setPhase("error");
    resetVerification();
  }

  function retryChallenge() {
    setErrorMessage("");
    setPhase("idle");
    setChallengeAttempt((attempt) => attempt + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deliveryConfigured || !endpoint || !siteKey || pendingRef.current || phase === "received") return;

    const submission: LeadFields = {
      ...fields,
      honeypot: String(new FormData(event.currentTarget).get("honeypot") ?? ""),
    };
    const nextErrors = validateFields(submission, demoProductIds);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setErrorMessage("Please correct the highlighted fields and try again.");
      setPhase("error");
      focusFirstError(nextErrors);
      return;
    }
    if (!turnstileToken) {
      setErrorMessage("Complete the bot verification before submitting.");
      setPhase("error");
      return;
    }

    const pageUrl = new URL(window.location.href);
    pageUrl.hash = "";
    const payload: LeadPayload = {
      intent: submission.intent,
      name: submission.name.trim(),
      email: submission.email.trim(),
      organization: submission.organization.trim() || null,
      productId: submission.productId || null,
      page: pageUrl.toString(),
      message: submission.message.trim(),
      consent: true,
      honeypot: submission.honeypot,
      locale: currentLocale(),
      turnstileToken,
    };

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15_000);
    pendingRef.current = true;
    setPhase("submitting");
    setErrorMessage("");
    setErrors({});
    setReceiptId(undefined);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify(payload),
        credentials: "omit",
        cache: "no-store",
        redirect: "error",
        referrerPolicy: "no-referrer",
        signal: controller.signal,
      });
      const data = await readResponseJson(response);

      if (response.status === 202 && data?.status === "received") {
        const receipt = typeof data.receiptId === "string" && data.receiptId.trim() ? data.receiptId : undefined;
        setReceiptId(receipt);
        setPhase("received");
        setTurnstileToken("");
        const widgetId = widgetIdRef.current;
        if (widgetId !== undefined) {
          widgetIdRef.current = undefined;
          try {
            (window as TurnstileWindow).turnstile?.remove(widgetId);
          } catch {
            // Receipt confirmation does not depend on widget cleanup.
          }
        }
        return;
      }

      const errorRecord = data?.error && typeof data.error === "object" && !Array.isArray(data.error)
        ? data.error as Record<string, unknown>
        : null;
      const code = typeof errorRecord?.code === "string" ? errorRecord.code : "";

      if (response.status === 400) {
        const responseFields = Array.isArray(errorRecord?.fields)
          ? errorRecord.fields.filter((field): field is string => typeof field === "string")
          : [];
        const nextErrors: FieldErrors = {};
        let contextMessage = "";
        for (const field of responseFields) {
          if (field in serverFieldErrors) nextErrors[field as VisibleField] = serverFieldErrors[field];
          else if (field in serverContextErrors) contextMessage = serverContextErrors[field];
        }
        const message = Object.keys(nextErrors).length > 0
          ? "Please correct the highlighted fields and try again."
          : contextMessage || (code === "invalid_idempotency_key"
            ? "The service rejected the request identifier. Please retry."
            : "The request was rejected. Review your details and try again.");
        failRequest(message, nextErrors);
        focusFirstError(nextErrors);
        return;
      }

      if (response.status === 403) {
        failRequest(code === "origin_not_allowed"
          ? "This page origin is not authorised for enquiry delivery. No request was submitted."
          : "Bot verification failed. No request was submitted. Complete the verification again before retrying.");
        return;
      }
      if (response.status === 409) {
        failRequest("The service reported a duplicate-request conflict. No new receipt was confirmed. Refresh the page before trying again.");
        return;
      }
      if (response.status === 429) {
        failRequest("Too many requests. Please wait before trying again.");
        return;
      }
      if (response.status === 503) {
        failRequest(code === "turnstile_unconfigured"
          ? "Enquiry delivery is unavailable because bot verification is not configured on the service. No request was submitted."
          : "Enquiry delivery is temporarily unavailable. No receipt was confirmed; please try again later.");
        return;
      }
      if (response.status === 202) {
        failRequest("The service returned an unexpected response. No receipt was confirmed; please try again.");
        return;
      }
      failRequest(`The enquiry service rejected the request (HTTP ${response.status}). No receipt was confirmed; please try again later.`);
    } catch {
      failRequest("No receipt was confirmed. The network request did not complete, so the enquiry may or may not have been received. Check your connection before retrying.");
    } finally {
      window.clearTimeout(timeoutId);
      pendingRef.current = false;
    }
  }

  if (!configured || (urlStateReady && !deliveryConfigured)) {
    return (
      <div className="lead-form lead-form--unconfigured">
        <p className="t-label">Contact the team</p>
        <div role="status" aria-live="polite" aria-atomic="true">
          <p className="status">Tell us what you are trying to change and we will reply with the product that fits, the deployment model and the next step.</p>
          <p className="lead-form__privacy">Your enquiry type and product are filled in for you.</p>
        </div>
        <a className="button button--primary" href={emailFallbackHref} data-cta="request-conversation">Email the team</a>
        <p className="lead-form__privacy">Opens your email client with the details already written. Nothing is sent from this page.</p>
      </div>
    );
  }

  if (!urlStateReady) {
    return (
      <div className="lead-form lead-form--loading" role="status" aria-live="polite">
        <p className="t-label">Enquiry context</p>
        <p className="status">Applying the requested enquiry type and product…</p>
      </div>
    );
  }

  if (phase === "received") {
    return (
      <div className="lead-form lead-form__received" role="status" aria-live="polite" aria-atomic="true">
        <p className="status"><strong>Request received</strong></p>
        {receiptId && <p className="lead-form__receipt">Receipt ID: <code>{receiptId}</code></p>}
        <p className="lead-form__privacy">We will reply by email with the product fit, the deployment questions worth answering and a proposed next step.</p>
      </div>
    );
  }

  const statusMessage = phase === "submitting"
    ? "Submitting your enquiry…"
    : phase === "error"
      ? errorMessage || challengeNotice
      : challengeNotice;

  return (
    <form
      className="form lead-form"
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      aria-busy={pending}
      data-lead-form=""
      data-lead-intent={fields.intent}
      data-lead-product={fields.productId || undefined}
    >
      <div className="lead-form__grid">
        <div className="field lead-form__field lead-form__field--full">
          <label className="lead-form__label" htmlFor={`${formId}-intent`}>What do you need?<span className="lead-form__requirement">Required</span></label>
          <select
            id={`${formId}-intent`}
            name="intent"
            value={fields.intent}
            onChange={(event) => updateField("intent", event.target.value as LeadIntent)}
            required
            disabled={pending}
            aria-invalid={errors.intent ? true : undefined}
            aria-describedby={describedBy("intent")}
          >
            {intentOptions.map((option) => <option value={option.value} key={option.value} disabled={option.value === "demo" && demoSelectionBlocked}>{option.label}</option>)}
          </select>
          {inlineError("intent")}
        </div>

        <div className="field lead-form__field">
          <label className="lead-form__label" htmlFor={`${formId}-name`}>Name<span className="lead-form__requirement">Required</span></label>
          <input
            id={`${formId}-name`}
            name="name"
            type="text"
            autoComplete="name"
            maxLength={120}
            value={fields.name}
            onChange={(event) => updateField("name", event.target.value)}
            required
            disabled={pending}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name")}
          />
          {inlineError("name")}
        </div>

        <div className="field lead-form__field">
          <label className="lead-form__label" htmlFor={`${formId}-email`}>Email<span className="lead-form__requirement">Required</span></label>
          <input
            id={`${formId}-email`}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            value={fields.email}
            onChange={(event) => updateField("email", event.target.value)}
            required
            disabled={pending}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email")}
          />
          {inlineError("email")}
        </div>

        <div className="field lead-form__field lead-form__field--full">
          <label className="lead-form__label" htmlFor={`${formId}-organization`}>Organization<span className="lead-form__requirement">Optional</span></label>
          <input
            id={`${formId}-organization`}
            name="organization"
            type="text"
            autoComplete="organization"
            maxLength={160}
            value={fields.organization}
            onChange={(event) => updateField("organization", event.target.value)}
            disabled={pending}
            aria-invalid={errors.organization ? true : undefined}
            aria-describedby={describedBy("organization")}
          />
          {inlineError("organization")}
        </div>

        <div className="field lead-form__field lead-form__field--full">
          <label className="lead-form__label" htmlFor={`${formId}-productId`}>Product<span className="lead-form__requirement">{fields.intent === "demo" ? "Required" : "Optional"}</span></label>
          <select
            id={`${formId}-productId`}
            name="productId"
            value={fields.productId}
            onChange={(event) => updateField("productId", event.target.value)}
            required={fields.intent === "demo"}
            disabled={pending}
            aria-invalid={errors.productId ? true : undefined}
            aria-describedby={describedBy("productId", `${formId}-product-hint`)}
          >
            <option value="">{fields.intent === "demo" ? "Select a catalogue product" : "No specific product"}</option>
            {products.map((product) => <option value={product.id} key={product.id} disabled={fields.intent === "demo" && !product.demoEligible}>{product.name}</option>)}
          </select>
          <p className="lead-form__hint" id={`${formId}-product-hint`}>Demo requests require a demo-eligible catalogue product. Other enquiries may leave this blank.</p>
          {inlineError("productId")}
        </div>

        <div className="field lead-form__field lead-form__field--full">
          <label className="lead-form__label" htmlFor={`${formId}-message`}>How can we help?<span className="lead-form__requirement">Required</span></label>
          <textarea
            id={`${formId}-message`}
            name="message"
            maxLength={4_000}
            value={fields.message}
            onChange={(event) => updateField("message", event.target.value)}
            required
            disabled={pending}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={describedBy("message", `${formId}-message-hint`)}
          />
          <p className="lead-form__hint" id={`${formId}-message-hint`}>Up to 4,000 characters. Do not include passwords, confidential records or unnecessary personal data.</p>
          {inlineError("message")}
        </div>

        <div className="lead-form__honeypot" aria-hidden="true">
          <label htmlFor={`${formId}-honeypot`}>Leave this field empty</label>
          <input
            id={`${formId}-honeypot`}
            name="honeypot"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            maxLength={256}
            value={fields.honeypot}
            onChange={(event) => updateField("honeypot", event.target.value)}
            disabled={pending}
          />
        </div>

        <div className="field lead-form__consent lead-form__field--full">
          <input
            id={`${formId}-consent`}
            name="consent"
            type="checkbox"
            checked={fields.consent}
            onChange={(event) => updateField("consent", event.target.checked)}
            required
            disabled={pending}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={describedBy("consent", `${formId}-privacy`)}
          />
          <div>
            <label htmlFor={`${formId}-consent`}>I consent to the enquiry service using these details to handle this request.<span className="lead-form__requirement">Required</span></label>
            {inlineError("consent")}
          </div>
        </div>
      </div>

      <p className="lead-form__privacy" id={`${formId}-privacy`}>Privacy: these details are submitted to handle this enquiry. Controller identity and retention wording require owner approval before publication.</p>

      <div className="lead-form__verification">
        <p className="t-label">Bot verification</p>
        <div className="lead-form__turnstile" ref={turnstileContainerRef} aria-busy={challengeStatus === "loading"} />
        {challengeStatus === "error" && <button className="text-link" type="button" onClick={retryChallenge}>Retry verification</button>}
      </div>

      <div className="lead-form__actions">
        <button className="button button--primary" type="submit" disabled={!canSubmit}>
          {pending ? "Submitting…" : fields.intent === "demo" ? "Request product demo" : "Send enquiry"}
        </button>
        <p className="lead-form__action-note">We reply by email with the next step. Your details are used for this conversation only.</p>
      </div>

      <div className="lead-form__status" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage && <p className={`status${phase === "error" || challengeStatus === "error" || challengeStatus === "expired" ? " status--error" : ""}`}>{statusMessage}</p>}
      </div>
    </form>
  );
}
