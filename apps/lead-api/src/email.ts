import type { EmailConfig } from "./config";
import type { LeadRecord } from "./leads";
import type { DeliveryResult } from "./webhook";

const RESEND_URL = "https://api.resend.com/emails";

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function emailContent(lead: LeadRecord): { subject: string; text: string; html: string } {
  const subject = `New ${lead.intent} enquiry`;
  const lines = [
    `Intent: ${lead.intent}`,
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Organization: ${lead.organization ?? "Not supplied"}`,
    `Product: ${lead.productId ?? "Not supplied"}`,
    `Source: ${lead.sourceOrigin}${lead.pagePath}`,
    `Locale: ${lead.locale}`,
    `Receipt: ${lead.receiptId}`,
    "",
    lead.message,
  ];
  const text = lines.join("\n");
  const html = `<h1>${escapeHtml(subject)}</h1><dl>${lines
    .slice(0, 8)
    .map((line) => {
      const separator = line.indexOf(": ");
      return `<dt>${escapeHtml(line.slice(0, separator))}</dt><dd>${escapeHtml(line.slice(separator + 2))}</dd>`;
    })
    .join("")}</dl><p>${escapeHtml(lead.message).replaceAll("\n", "<br>")}</p>`;
  return { subject, text, html };
}

export async function deliverEmail(input: {
  config: EmailConfig;
  lead: LeadRecord;
  deliveryId: string;
  fetchImpl: typeof fetch;
}): Promise<DeliveryResult> {
  const started = Date.now();
  if (!input.config.configured || !input.config.apiKey || !input.config.from) {
    return { outcome: "permanent", errorCategory: "config_error", durationMs: Math.max(0, Date.now() - started) };
  }
  const content = emailContent(input.lead);
  try {
    const response = await input.fetchImpl(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.config.apiKey}`,
        "Content-Type": "application/json",
        // Resend honors this key for 24 hours; deliveryId is stable in D1.
        "Idempotency-Key": input.deliveryId,
      },
      body: JSON.stringify({
        from: input.config.from,
        to: [...input.config.recipients],
        ...(input.config.replyTo ? { reply_to: input.config.replyTo } : {}),
        subject: content.subject,
        text: content.text,
        html: content.html,
      }),
      redirect: "error",
      signal: AbortSignal.timeout(input.config.timeoutMs),
    });
    if (response.status >= 200 && response.status < 300) {
      return { outcome: "accepted", httpStatus: response.status, errorCategory: "provider_accepted", durationMs: Math.max(0, Date.now() - started) };
    }
    const retryable = response.status === 429 || response.status >= 500;
    return {
      outcome: retryable ? "retryable" : "permanent",
      httpStatus: response.status,
      errorCategory: retryable ? "provider_unavailable" : "provider_rejected",
      durationMs: Math.max(0, Date.now() - started),
    };
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      outcome: "retryable",
      errorCategory: timedOut ? "timeout" : "network_error",
      durationMs: Math.max(0, Date.now() - started),
    };
  }
}
