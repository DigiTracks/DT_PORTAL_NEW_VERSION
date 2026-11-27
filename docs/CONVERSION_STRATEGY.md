# Digi Tracks conversion strategy

**Status:** implementation baseline

**Date:** 2026-11-26

**Primary outcome:** qualified product, demo, migration and support enquiries with durable receipt evidence and separately tracked delivery

**Access policy:** public explanation; request-only MIND ONE access; separately qualified demo grants

## 1. Business model and conversion principle

Digi Tracks products remain quote-led. The public estate does not add checkout, invented numeric pricing, free-trial promises or unsupported buying claims.

The website has two jobs:

1. Help a visitor identify the right product, solution or learning path.
2. Turn a serious requirement into a traceable conversation.

The previous strategy answered too many product questions publicly and distributed unrestricted demo links. The replacement gives enough verified information to make an informed enquiry, then controls access to the full working product.

This is not a dark-pattern gate. Visitors can still understand the product's purpose, audience, access model, boundaries and relevant learning material before requesting access.

## 2. Conversion hierarchy

Each page has one primary action. Secondary actions are quieter and must not compete with the primary decision.

| Route class | Primary action | Secondary action | Prohibited public action |
|---|---|---|---|
| Portal home | Explore all products | Start a conversation or find a product | Open unrestricted full demo |
| MIND ONE Basic / MIND ONE Complete | Request the relevant edition access | Compare Basic and Complete or discuss data handling | Implied release, instant access or invented edition features |
| Edition comparison | Ask about edition access | Review each product page | Fabricated entitlement, quota, price, provider or launch comparison |
| Product page | Request a product demo or evaluation | Discuss a buying or migration need | Public checkout or invented price |
| Procurement ecosystem | Explore the right procurement system | Ask for guidance or learning access | Implied shared backend, MCP or unverified integration |
| Solution/industry page | Discuss the workflow | Explore related products | Unsupported outcome or customer proof |
| Services | Start a scoped conversation | Review engagement paths | Pre-packaged claims without evidence |
| Capability hub | Find the right tool | Ask for guidance | Generic “learn more” loop |
| Contact | Send your requirement | Choose a different intent or continue by email | Arbitrary email destination |
| Learn home | Choose a learning path | Ask about team learning | Claiming certification not verified |
| Product-learning page | Start the relevant path | Ask about the product | Duplicating product sales copy |
| SourceCraft | Use the study tool locally | Request content/support help | Public full-product access not in scope |
| ProcureSherpa | Request guided access | Review verified capabilities | Public full-play URL |
| LearnPMO | Start an available local/public path | Request team access | Fake progress or simulated scoring |
| HCM Fusion | Explore the approved library | Request course/team access | Exposing assessment answers or private progress |

Button labels use a verb and an object: **Explore all products**, **Request Basic access**, **Request Complete access**, **Request a product demo**, **Discuss your workflow**, **Start a learning path**. Avoid “Submit”, “Click here”, “Learn more” and ambiguous edition shorthand as primary labels.

For MIND ONE, the enquiry is an access request only. It does not take payment, issue a demo link, activate billing, grant commercial entitlement or confirm launch availability. Implemented Complete-edition scope is not a released entitlement table.

## 3. Page-level CTA map

### Portal

- Hero: `Explore all products` → catalogue; `Start a conversation` → consultation.
- Homepage family block: `Request MIND ONE access` → `product-enquiry` with `product=mindone`, plus `Compare Basic and Complete`.
- MIND ONE Basic: `Request Basic access` → `product-enquiry` with `product=mindone`.
- MIND ONE Complete: `Request Complete access` → `product-enquiry` with `product=mindone-pro`; the stable route remains `/products/mindone-pro/`.
- Edition comparison: edition-access CTAs and direct routes back to each product; reviewed implementation is separated from unknown commercial terms.
- Procurement ecosystem: product-specific demo/evaluation CTAs plus `learning` with `product=sherpa` for ProcureSherpa Learning.
- Product index: contextual demo/evaluation controls preserve the selected product; `demo` is offered only when the catalogue marks the product requestable and `available`.
- Product page: product-specific demo or evaluation plus buying/migration discussion.
- Solution/industry page: request review with relevant product/solution context already attached.
- Services: `consultation`, `migration` or `support` selected by engagement.
- Hub: guidance CTA with the hub and selected capability attached.
- Trust/legal/utility pages: no sales CTA unless directly relevant.

### Learning estate

- Learn home: `Choose a learning path`.
- ProcureSherpa Learning: explore the Academy/learning component or ask about learning access with `intent=learning&product=sherpa`; it is not presented as a separate verified SKU.
- Product-learning page: start the path if real public content exists; otherwise explain the access boundary and request guidance.
- Learning content: next lesson/path action; product enquiry only at a relevant decision point.
- SourceCraft: local study actions such as save, compare or export; support enquiry is secondary.
- LearnPMO/HCM Fusion: preserve real public/local functionality; request team access where protected content begins.

### Application origins

Application tools must not inherit marketing-page CTA noise. Their primary action is the real task: search, open a route, save work, continue a lesson or export approved material. Lead forms live in contextual request surfaces, not persistent overlays.

## 4. Enquiry intents

The shared form and API use the same fixed seven-value intent registry:

| Intent | Visitor need | Product rule |
|---|---|---|
| `product-enquiry` | Explore a product for a requirement | Optional |
| `demo` | See a product working with their use case | Required; must be public, requestable and marked `available` |
| `consultation` | Discuss a workflow, architecture or buying need | Optional |
| `migration` | Move from an existing tool/process | Optional |
| `support` | Get help with an existing product | Optional |
| `partnership` | Explore a business relationship | Optional |
| `learning` | Discuss team or product learning | Optional |

All intents require name, email, message, consent, an empty honeypot and a Turnstile token. The client also sends browser-normalised locale and same-origin page context; the server may default locale to `en`. Organisation and product are optional except that `demo` requires a demo-eligible product. The visitor never chooses an email recipient. Intent, product and page context are validated on the server. The same catalogue-derived eligibility set controls static and hydrated CTAs, contact URL normalization, manual selection, client validation, Worker lead validation and operator issuance.

## 5. Form design

The implementation is one shared form, not a multi-step qualification flow. Its payload contains:

- Intent.
- Name, 1–120 characters, and a valid email of at most 254 characters.
- Optional organisation, maximum 160 characters.
- Optional product, except that `demo` requires a public, requestable product marked `available`.
- Required message, maximum 4,000 characters.
- Required enquiry/privacy consent.
- Hidden honeypot, which must remain empty.
- Browser-normalised locale and same-origin page context with the hash removed.
- Turnstile token from the widget.

There are no role, team, timeline, phone or preferred-contact fields. The form renders only when both `PUBLIC_LEAD_ENDPOINT` and `PUBLIC_TURNSTILE_SITE_KEY` are configured and the endpoint passes the environment policy; otherwise it collects no details and offers **Continue by email**, opening `mailto:contact@digitracks.net` with the selected intent/product and a safe prompt. A policy-blocked local endpoint instead renders the explicit local-delivery-blocked state. Nothing is sent from the page in either state.

### Form states

1. **Idle:** labels and requirements visible.
2. **Local delivery blocked:** a loopback page configured with a non-loopback endpoint renders no form, loads no Turnstile script and explains that production delivery is never contacted from localhost.
3. **Submitting:** controls disabled without losing entered data.
4. **Received:** only HTTP `202` with `status: "received"` confirms durable storage. Copy says email/CRM delivery is pending and does not promise delivery or demo access.
5. **Validation error:** field-level messages with `aria-describedby`, focus moved to the first invalid field.
6. **Request failed:** an explicit HTTP rejection has no confirmed receipt; preserve the form and allow retry. After a network failure or timeout, receipt is uncertain and the copy must not claim the enquiry was not saved.
7. **Access issued:** a separate operator action; never implied by form receipt.

No success animation or confirmation page may run before the API confirms durable receipt.

## 6. Demo-access journey

### Public stage

The product page contains:

- Verified purpose and audience.
- Real interface structure or approved screenshot where available.
- Relevant workflows stated without protected implementation detail.
- Buying/access model.
- Known boundaries and dependencies.
- **Request full demo access** only for demo-eligible products; request-only or otherwise ineligible products use **Request product evaluation** or **Register product interest** and never imply a demo grant.

It does not contain:

- A reusable public full-play URL.
- Credentials embedded in HTML, JavaScript, analytics or source control.
- A simulated workflow presented as the real product.
- A promise that access is instant.

### Qualification stage

The operator reviews:

- Product, when supplied, and the stated requirement.
- Organisation, when supplied.
- Whether the requested session is relevant to the product.
- Whether the enquiry is a demo, buying discussion, migration, support or partner need.
- Whether any owner-specific qualification rule applies.

No undocumented scoring rule is presented to visitors.

### Issuance stage

The operator-authenticated issuance flow is implemented. It rejects products outside the shared demo-eligibility set before creating a grant. Each issued link has:

- A random, high-entropy token; only its hash is stored.
- Product/scope and optional lead binding.
- Expiry time, defaulting to seven days and configurable from 1–720 hours.
- Revocation state and creation/redemption metadata.
- Single-use redemption.
- No token in logs or analytics.

Production issuance still requires the owner's destination inventory, operator secret and qualification policy. Revocation takes effect without deleting the audit record; revoked, expired or redeemed grants return a neutral 404. Form receipt alone never generates a link.

### Revocation

Operators must be able to revoke an individual access record. Revoked or expired tokens fail closed and return a neutral denial page without revealing whether a token previously existed.

## 7. Lead API request flow

All six public origins route enquiry CTAs to the shared portal contact form. Only that form submits to the owner-approved API endpoint through `PUBLIC_LEAD_ENDPOINT`, and it renders only when both the endpoint and Turnstile site key are configured and the endpoint passes the shared environment policy. Loopback pages (`localhost`, `127.0.0.0/8`, `::1` and IPv4-mapped loopback IPv6) accept loopback endpoints only; published pages accept non-loopback HTTPS endpoints only. A local preview configured with a production endpoint is blocked before the form or bot-verification script loads. When unconfigured, the shared surface collects nothing and provides the contextual email fallback instead.

1. Allow only `POST`.
2. Validate the exact allowed origin against the origin registry.
3. Apply approximate per-isolate abuse controls.
4. Reject an oversized declared body and enforce a hard 20,000-byte stream cap.
5. Parse JSON and validate the fixed schema and field lengths.
6. Reject a filled honeypot.
7. Require coherent Turnstile configuration and verify every submission; missing or incoherent configuration returns `503` and fails closed.
8. Require a valid client UUID `Idempotency-Key`; identical retries return the original receipt, while changed content under the same key conflicts.
9. Insert the minimised lead, outbox work and idempotency record in one D1 transaction.
10. Return `202` with `status: "received"` only after durable storage.
11. Process email and signed CRM delivery asynchronously; a post-commit queue failure can report `delivery: "pending_repair"` without losing the receipt.

Recipient addresses, sender identity, CRM field mapping and secrets remain server-side. The client cannot supply an arbitrary destination.

### Implemented response semantics

- `202 Accepted`: `status: "received"`, a receipt ID, duplicate flag and asynchronous delivery state; email/CRM delivery is not yet confirmed.
- `400 Bad Request`: invalid schema or fields.
- `403 Forbidden`: origin, bot verification or abuse rejection.
- `409 Conflict`: an idempotency key was reused with different content.
- `413 Payload Too Large`: body exceeds the cap.
- `429 Too Many Requests`: approximate rate limit exceeded.
- `503 Service Unavailable`: required Turnstile, D1 or Queue configuration/binding is unavailable.

The response never includes internal queue, database or CRM error detail.

## 8. Durable delivery model

### D1 records

- `leads`: minimised enquiry, intent, product/context, source route, consent timestamp, received time and status.
- `outbox`: stable delivery work item, destination type, attempt state and next-attempt time.
- `delivery_attempts`: provider/receiver outcome, status code, timing and redacted diagnostic category.
- `idempotency_keys`: stable key, request fingerprint and resulting lead ID.

No secret, raw Turnstile token or unnecessary payload copy is stored.

### Status vocabulary

- Lead status is `received` once the D1 transaction commits.
- Outbox states are `pending`, `processing`, `retry_scheduled`, `email_accepted`, `webhook_acknowledged`, `failed` and `dead_letter`.
- `email_accepted`: Resend accepted the request; inbox delivery is not thereby proven.
- `webhook_acknowledged`: CRM receiver returned an approved success response.
- `retry_scheduled`: transient failure awaits another attempt.
- `failed`: permanent delivery failure.
- `dead_letter`: bounded retries exhausted.

Visitor-facing copy uses “request received”, not “delivered to our inbox/CRM”, until staging evidence supports a stronger statement.

## 9. Email delivery

- Use Resend with a verified sender and configured reply-to.
- Use a stable 24-hour `Idempotency-Key` for retries.
- Escape all visitor-controlled content in HTML email.
- Keep fixed internal recipients out of client payloads.
- Avoid sending sensitive free text to analytics, logs or unnecessary third parties.
- A provider acceptance response is not proof of inbox placement.

Real end-to-end tests require the owner's sending domain, API key, From/Reply-To and destination inbox. Until those are supplied and tested, production email delivery is `UNKNOWN`; provider acceptance and inbox placement must not be inferred from durable receipt.

## 10. CRM webhook contract

The CRM receiver is configurable and must use HTTPS.

### Security

- HMAC-SHA-256 over timestamp + raw body.
- Stable delivery ID.
- Event version.
- Rotation-friendly secret.
- Short replay window.
- Receiver-side deduplication by delivery ID.
- Redirects disabled or restricted to approved hosts.

### Payload

The payload contains only mapped, minimised fields:

- Delivery ID and event version.
- Received timestamp.
- Intent and product ID, when supplied.
- Source origin and same-origin page path.
- Name, email and organisation, when supplied.
- Requirement text only where the CRM contract requires it.

### Delivery behavior

- Explicit timeout.
- Bounded retries with backoff.
- Retryable versus permanent HTTP status handling.
- Dead-letter destination.
- No retry of permanent validation failures without operator action.
- Stable field mapping held in configuration, not scattered through page code.

The staging receiver must prove signature acceptance/rejection, duplicate suppression, timeout, retry, permanent failure and dead-letter handling.

## 11. First-party event taxonomy

### Browser events

When `PUBLIC_LEAD_ENDPOINT` is configured and passes the shared environment policy, a small first-party bridge sends allowlisted `POST /api/events` requests. Without a compatible endpoint it sends nothing; a loopback page never sends analytics to a production endpoint.

| Event | Implemented trigger |
|---|---|
| `cta_click` | Click on a registered CTA |
| `demo_open` | Demo CTA click whose same-origin target carries `intent=demo` |
| `lead_start` | First focus inside the shared enquiry form |
| `lead_submit` | Enquiry form submission attempt, including client-invalid attempts |
| `resource_export` | SourceCraft favourites or ProcureSherpa notes export |

Payloads contain only the event plus optional allowlisted intent, catalogue product ID, CTA ID and resource ID. CTA context comes only from same-origin `intent` and `product` query parameters. The endpoint enforces exact origin, an approximate limit of at least 60 requests per minute and a 2,000-byte streamed body cap. It requires no D1, Queue or Turnstile binding and returns `204` even when Analytics Engine is absent or fails.

Browser points use six fixed Analytics Engine blobs: intent, product ID, `none`, `none`, CTA ID and resource ID. They carry no URL, query string, form value, cookie, local-storage value, correlation ID, name, email, organisation, message or token. Transport uses omitted credentials, no referrer, no redirects and a caught failure; telemetry cannot change navigation, exports or enquiry state. Client-validation error categories are not emitted.

### Server events

| Event | Implemented trigger |
|---|---|
| `lead_received` | API durably receives an enquiry |
| `lead_delivery_email` | Email provider accepts the request |
| `lead_delivery_webhook` | CRM acknowledges the payload |
| `lead_delivery_failed` | Delivery permanently fails or reaches dead letter |
| `demo_access_issued` | Operator creates an access grant |
| `demo_access_revoked` | Operator revokes an access grant |

Server dimensions are limited to intent, product ID, hashed correlation ID, destination, error category and reason category. Never emit names, email addresses, organisations, messages, phone numbers, tokens, credentials, raw request text or URLs containing query secrets. Analytics failure does not change lead or delivery outcomes. Production consent and retention wording must match this actual scope and receive owner approval.

## 12. Measurement

The initial baseline is unknown. Do not invent conversion rates or targets.

Implemented browser events can report registered CTA clicks, demo opens, first form focus, submission attempts and the two local export actions. API events can report durable receipts by intent/product, email acceptance, CRM acknowledgement, permanent delivery failures, dead letters and demo grant issuance/revocation.

Production volumes remain `UNKNOWN` until the endpoint, Analytics Engine and privacy wording are approved. Client-validation error categories, time to operator review, qualification outcomes, demo activation/expiry and learning-path continuation remain `UNKNOWN`; they need separate operational evidence or a separately approved event. A submission attempt is not a durable receipt, and neither is proof of delivery or access.

A dashboard or report must label unavailable data as `UNKNOWN`, with impact and the evidence needed to resolve it.

## 13. Privacy and trust copy

The privacy notice must describe:

- Which fields are collected.
- Why they are collected.
- Where the lead is stored.
- Which processors receive it.
- Retention and deletion policy.
- How access requests are handled.
- Whether analytics is enabled and what it does not collect.

Turnstile is required, not an optional runtime enhancement. If the lead endpoint or site key is missing, the form does not render or collect details; the contextual email fallback opens the visitor's mail client and sends nothing from the page. If a loopback page is configured with a non-loopback endpoint, delivery and bot verification are disabled before any external request. If server configuration is missing or incoherent, the API returns `503` and fails closed.

The implemented form has one required, unticked enquiry/privacy consent. It does not implement a separate marketing opt-in; any future marketing consent must remain distinct and optional.

## 14. Failure and abuse handling

- Invalid origin: reject without processing.
- Oversized body: reject before full parsing.
- Honeypot: reject without exposing the reason to automated clients.
- Turnstile missing/incoherent configuration: fail closed.
- Durable storage unavailable: return failure and send nothing.
- Email failure: lead remains received; retry or dead-letter without losing the enquiry.
- CRM failure: email may continue independently; delivery statuses remain separate.
- Duplicate request: return the original receipt without creating a second lead or delivery.
- Logs: correlation ID, route, status and error category only.

Approximate rate limiting is not described as a strict global guarantee. Cloudflare WAF controls may be added for stronger edge enforcement.

## 15. Operator workflow

1. Monitor durable receipts and failed deliveries without exposing PII publicly.
2. Review new demo/product enquiries.
3. Classify or correct intent where necessary.
4. Qualify the request against documented business rules.
5. Send a relevant reply through the approved mailbox.
6. Issue scoped demo access if appropriate.
7. Record access issuance/revocation.
8. Mark the enquiry outcome without rewriting the original received record.
9. Escalate permanent delivery failures and dead letters.

Operator access, authentication and audit rules require owner configuration. They must not be implemented as an unprotected public endpoint.

## 16. Staging acceptance tests

Before any delivery claim, prove:

- Every form intent from every origin.
- Valid and invalid payloads.
- Exact-origin and cross-origin behavior.
- 20 KB boundary and streamed oversize rejection.
- Honeypot and Turnstile rejection.
- Durable `received` semantics when D1 succeeds.
- No success response when D1 fails.
- Idempotent duplicate suppression.
- Real Resend inbox receipt.
- Signed CRM receipt and duplicate suppression.
- Signature failure and replay rejection.
- Timeout, retry, permanent failure and dead letter.
- No PII or secrets in analytics/logs.
- Demo request without a public full-play URL.
- Configured operator issuance, single-use redemption, expiry and revocation.

## 17. Copy boundaries

Useful confirmation copy after HTTP `202` with `status: "received"`:

> Request received; email/CRM delivery is pending. This does not confirm delivery, product access, billing, a demo grant or commercial entitlement.

Useful network-failure or timeout copy:

> No receipt was confirmed. The network request did not complete, so the enquiry may or may not have been received. Check your connection before retrying.

Avoid:

> Our team will contact you within one hour.

Unless that service level is approved and measured.

Avoid:

> Your demo is ready.

Unless a real access record was issued and the link was delivered through an approved channel.

## 18. Dependencies

The shared UI, validation, Worker, D1/outbox flow and signed demo-grant flow are implemented. Production operation still requires:

- API origin and deployment configuration.
- D1/Queue bindings and operational access.
- Resend account, verified sender and destination inbox.
- CRM HTTPS receiver, authentication/signing contract and field mapping.
- Turnstile keys and final privacy/retention wording.
- Demo destination inventory, qualification policy and operator credentials.
- MIND ONE Basic/Complete commercial entitlement, quotas, provider terms, billing, integrations, deployment and launch policy.
- Operator authentication configuration and retention policy.

Until these exist, local test doubles must be labelled as tests and the handoff must report the affected production behavior as blocked or `UNKNOWN`.
