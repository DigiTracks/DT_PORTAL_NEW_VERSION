import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Route } from "@playwright/test";

const contactUrl = "/contact/?intent=demo&product=unify";
const leadEndpoint = "**/api/lead";
const analyticsEndpoint = "**/api/events";
const siteKey = "1x00000000000000000000AA";
const person = {
  name: "Avery Example",
  email: "avery@example.com",
  organization: "Example Operations",
  message: "We need to evaluate Unify for a qualified procurement workflow."
};

type RenderOptions = {
  sitekey: string;
  action: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

type TurnstileCall = { type: "render" | "reset" | "remove"; sitekey?: string; widgetId?: string };

declare global {
  interface Window {
    __turnstileCalls?: TurnstileCall[];
    __turnstileActions?: { expire: () => void; error: () => void };
  }
}

async function expectAccessible(page: Page, state: string) {
  const report = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(report.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => ({ target: node.target, summary: node.failureSummary }))
  })), state).toEqual([]);
}

async function installTurnstileStub(page: Page) {
  await page.addInitScript((expectedSiteKey) => {
    const calls: TurnstileCall[] = [];
    const widgets = new Map<string, RenderOptions>();
    window.__turnstileCalls = calls;
    const turnstileWindow = window as Window & {
      turnstile: {
        render: (container: HTMLElement, options: RenderOptions) => string;
        reset: (widgetId?: string) => void;
        remove: (widgetId?: string) => void;
      };
    };
    turnstileWindow.turnstile = {
      render(container: HTMLElement, options: RenderOptions) {
        if (options.sitekey !== expectedSiteKey) throw new Error("unexpected_turnstile_site_key");
        const widgetId = `widget-${calls.length + 1}`;
        calls.push({ type: "render", sitekey: options.sitekey, widgetId });
        widgets.set(widgetId, options);
        container.dataset.widgetId = widgetId;
        queueMicrotask(() => options.callback(`token-${widgetId}`));
        return widgetId;
      },
      reset(widgetId = "widget-1") {
        calls.push({ type: "reset", widgetId });
        const options = widgets.get(widgetId);
        if (options) queueMicrotask(() => options.callback(`token-${widgetId}-reset`));
      },
      remove(widgetId = "widget-1") {
        calls.push({ type: "remove", widgetId });
        widgets.delete(widgetId);
      }
    };
    window.__turnstileActions = {
      expire: () => widgets.get("widget-1")?.["expired-callback"](),
      error: () => widgets.get("widget-1")?.["error-callback"]()
    };
  }, siteKey);
}

async function fillValidEnquiry(page: Page) {
  await page.getByLabel("Name", { exact: false }).fill(person.name);
  await page.getByLabel("Email", { exact: false }).fill(person.email);
  await page.getByLabel("Organization", { exact: false }).fill(person.organization);
  await page.getByLabel("How can we help?").fill(person.message);
  await page.getByLabel(/I consent to the enquiry service/).check();
}

async function captureRequest(page: Page, response: { status: number; body: unknown }) {
  let captured: { headers: Record<string, string>; body: Record<string, unknown>; url: string } | undefined;
  await page.route(leadEndpoint, async (route: Route) => {
    const request = route.request();
    captured = {
      headers: request.headers(),
      body: request.postDataJSON() as Record<string, unknown>,
      url: request.url()
    };
    await route.fulfill({
      status: response.status,
      contentType: "application/json",
      body: JSON.stringify(response.body)
    });
  });
  return () => captured;
}

async function captureAnalytics(page: Page) {
  const payloads: Record<string, unknown>[] = [];
  const headers: Record<string, string>[] = [];
  await page.route(analyticsEndpoint, async (route: Route) => {
    const request = route.request();
    payloads.push(request.postDataJSON() as Record<string, unknown>);
    headers.push(request.headers());
    await route.fulfill({ status: 204 });
  });
  return { payloads, headers };
}

async function openConfiguredForm(page: Page) {
  await installTurnstileStub(page);
  await page.goto(contactUrl);
  await expect(page.getByRole("button", { name: "Request product demo" })).toBeEnabled();
}

test("product CTA carries intent and catalogue product into the shared form", async ({ page }) => {
  const analytics = await captureAnalytics(page);
  await installTurnstileStub(page);
  await page.goto("/products/unify/");
  await page.getByRole("link", { name: "Request full demo access" }).click();
  await expect(page).toHaveURL(/\/contact\/\?intent=demo&product=unify$/);
  await expect(page.getByLabel("What do you need?")).toHaveValue("demo");
  await expect(page.getByLabel("Product", { exact: false })).toHaveValue("unify");
  await expect(page.getByRole("button", { name: "Request product demo" })).toBeEnabled();
  await expect.poll(() => analytics.payloads).toEqual([
    { event: "cta_click", intent: "demo", productId: "unify", ctaId: "request-product-demo" },
    { event: "demo_open", intent: "demo", productId: "unify", ctaId: "request-product-demo" }
  ]);
  for (const requestHeaders of analytics.headers) {
    expect(requestHeaders.cookie).toBeUndefined();
    expect(requestHeaders.referer).toBeUndefined();
    expect(requestHeaders.authorization).toBeUndefined();
  }
  const renderCalls = await page.evaluate(() => window.__turnstileCalls?.filter((call) => call.type === "render"));
  expect(renderCalls).toEqual([{ type: "render", sitekey: siteKey, widgetId: "widget-1" }]);
  await expectAccessible(page, "configured form with product context");
});

test("valid enquiry sends a fixed payload and confirms durable receipt without claiming delivery or access", async ({ page }) => {
  const requests: string[] = [];
  const consoleErrors: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  const getCaptured = await captureRequest(page, {
    status: 202,
    body: { status: "received", receiptId: "receipt-test-001" }
  });
  const analytics = await captureAnalytics(page);
  await openConfiguredForm(page);
  await fillValidEnquiry(page);
  await expect.poll(() => analytics.payloads).toEqual([
    { event: "lead_start", intent: "demo", productId: "unify" }
  ]);
  const originalUrl = page.url();
  await page.getByRole("button", { name: "Request product demo" }).click();

  const confirmation = page.getByRole("status").filter({ hasText: "Request received; email/CRM delivery is pending" });
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toContainText("Receipt ID: receipt-test-001");
  await expect(confirmation).toContainText("does not confirm email or CRM delivery");
  await expect(confirmation).toContainText("demo access is issued separately after qualification");
  await expectAccessible(page, "receipt confirmation");

  const captured = getCaptured();
  expect(captured).toBeDefined();
  expect(captured!.url).toBe("http://127.0.0.1:4331/api/lead");
  expect(captured!.headers["idempotency-key"]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  expect(captured!.headers["content-type"]).toBe("application/json");
  expect(captured!.body).toEqual({
    intent: "demo",
    name: person.name,
    email: person.email,
    organization: person.organization,
    productId: "unify",
    page: originalUrl,
    message: person.message,
    consent: true,
    honeypot: "",
    locale: "en-us",
    turnstileToken: "token-widget-1"
  });
  await expect.poll(() => analytics.payloads).toEqual([
    { event: "lead_start", intent: "demo", productId: "unify" },
    { event: "lead_submit", intent: "demo", productId: "unify" }
  ]);
  expect(JSON.stringify(analytics.payloads)).not.toContain(person.email);
  expect(JSON.stringify(analytics.payloads)).not.toContain(person.name);
  expect(JSON.stringify(analytics.payloads)).not.toContain(person.organization);
  expect(JSON.stringify(analytics.payloads)).not.toContain(person.message);
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual({});
  expect(page.url()).toBe(originalUrl);
  expect(requests.join(" ")).not.toContain(person.email);
  expect(requests.join(" ")).not.toContain(person.name.replaceAll(" ", "%20"));
  expect(consoleErrors).toEqual([]);
  const removed = await page.evaluate(() => window.__turnstileCalls?.filter((call) => call.type === "remove"));
  expect(removed).toEqual([{ type: "remove", widgetId: "widget-1" }]);
});

test("analytics transport failures do not change enquiry delivery or confirmation", async ({ page }) => {
  await page.route(analyticsEndpoint, (route) => route.abort("failed"));
  await captureRequest(page, {
    status: 202,
    body: { status: "received", receiptId: "receipt-test-002" }
  });
  await openConfiguredForm(page);
  await fillValidEnquiry(page);
  await page.getByRole("button", { name: "Request product demo" }).click();
  await expect(page.getByRole("status")).toContainText("Request received; email/CRM delivery is pending");
  await expect(page.getByRole("status")).toContainText("Receipt ID: receipt-test-002");
});

test("client validation focuses the first invalid field and sends no request", async ({ page }) => {
  let requestCount = 0;
  await page.route(leadEndpoint, async (route) => {
    requestCount += 1;
    await route.abort();
  });
  await openConfiguredForm(page);
  await page.getByRole("button", { name: "Request product demo" }).click();
  await expect(page.getByLabel("Name", { exact: false })).toBeFocused();
  await expect(page.getByLabel("Name", { exact: false })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("status")).toContainText("Please correct the highlighted fields");
  await expectAccessible(page, "client validation errors");
  expect(requestCount).toBe(0);
});

const responseCases = [
  {
    name: "unexpected 202 response",
    status: 202,
    body: { status: "queued" },
    message: "No receipt was confirmed"
  },
  {
    name: "field validation errors",
    status: 400,
    body: { error: { code: "invalid_payload", fields: ["email", "message"] } },
    message: "Please correct the highlighted fields"
  },
  {
    name: "origin rejection",
    status: 403,
    body: { error: { code: "origin_not_allowed" } },
    message: "origin is not authorised"
  },
  {
    name: "bot rejection",
    status: 403,
    body: { error: { code: "turnstile_failed" } },
    message: "Bot verification failed"
  },
  {
    name: "idempotency conflict",
    status: 409,
    body: { error: { code: "idempotency_conflict" } },
    message: "No new receipt was confirmed"
  },
  {
    name: "rate limit",
    status: 429,
    body: { error: { code: "rate_limited" } },
    message: "Too many requests"
  },
  {
    name: "unconfigured bot service",
    status: 503,
    body: { error: { code: "turnstile_unconfigured" } },
    message: "bot verification is not configured"
  },
  {
    name: "unavailable service",
    status: 503,
    body: { error: { code: "unavailable" } },
    message: "No receipt was confirmed"
  }
] as const;

for (const responseCase of responseCases) {
  test(`${responseCase.name} remains an explicit failure and permits a fresh verification`, async ({ page }) => {
    const getCaptured = await captureRequest(page, { status: responseCase.status, body: responseCase.body });
    await openConfiguredForm(page);
    await fillValidEnquiry(page);
    await page.getByRole("button", { name: "Request product demo" }).click();
    await expect(page.getByRole("status")).toContainText(responseCase.message);
    await expect(page.getByRole("button", { name: "Request product demo" })).toBeEnabled();
    expect(getCaptured()?.body.email).toBe(person.email);
    if (responseCase.status === 400) {
      await expect(page.getByLabel("Email", { exact: false })).toHaveAttribute("aria-invalid", "true");
      await expect(page.getByLabel("How can we help?")).toHaveAttribute("aria-invalid", "true");
      await expectAccessible(page, "server field errors");
    }
  });
}

test("network failure acknowledges uncertainty instead of claiming the enquiry was not received", async ({ page }) => {
  await page.route(leadEndpoint, (route) => route.abort("failed"));
  await openConfiguredForm(page);
  await fillValidEnquiry(page);
  await page.getByRole("button", { name: "Request product demo" }).click();
  await expect(page.getByRole("status")).toContainText("the enquiry may or may not have been received");
  await expect(page.getByRole("status")).not.toContainText("Request received");
  await expectAccessible(page, "uncertain network failure");
});

test("the 15-second abort leaves an honest uncertain state", async ({ page }) => {
  await page.clock.install();
  await page.route(leadEndpoint, () => new Promise(() => {}));
  await openConfiguredForm(page);
  await fillValidEnquiry(page);
  await page.getByRole("button", { name: "Request product demo" }).click();
  await expect(page.getByRole("button", { name: "Submitting…" })).toBeDisabled();
  await page.clock.fastForward(15_100);
  await expect(page.getByRole("status")).toContainText("the enquiry may or may not have been received");
});

test("expired and failed bot checks disable submission and failed checks can be retried", async ({ page }) => {
  await openConfiguredForm(page);
  const submit = page.getByRole("button", { name: "Request product demo" });
  await page.evaluate(() => window.__turnstileActions?.expire());
  await expect(submit).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("Bot verification expired");
  await expectAccessible(page, "expired bot verification");
  await page.evaluate(() => window.__turnstileActions?.error());
  await expect(submit).toBeDisabled();
  await expectAccessible(page, "failed bot verification");
  await page.getByRole("button", { name: "Retry verification" }).click();
  await expect(submit).toBeEnabled();
  await expect(page.getByRole("status")).toContainText("Bot verification complete");
});
