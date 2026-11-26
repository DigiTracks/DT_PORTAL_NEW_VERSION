CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  receipt_id TEXT NOT NULL UNIQUE,
  intent TEXT NOT NULL CHECK (intent IN ('product-enquiry', 'demo', 'consultation', 'migration', 'support', 'partnership', 'learning')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  product_id TEXT,
  source_origin TEXT NOT NULL,
  page_path TEXT NOT NULL,
  message TEXT NOT NULL,
  consent INTEGER NOT NULL CHECK (consent = 1),
  locale TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received')),
  received_at TEXT NOT NULL
);

CREATE TABLE idempotency_keys (
  key_hash TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  lead_id TEXT NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
  receipt_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE outbox (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'webhook')),
  delivery_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'retry_scheduled', 'email_accepted', 'webhook_acknowledged', 'failed', 'dead_letter')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INTEGER NOT NULL CHECK (max_attempts BETWEEN 1 AND 10),
  next_attempt_at TEXT NOT NULL,
  locked_until TEXT,
  last_error_category TEXT,
  last_http_status INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (lead_id, channel)
);

CREATE INDEX outbox_due ON outbox(status, next_attempt_at);
CREATE INDEX outbox_lease ON outbox(status, locked_until);

CREATE TABLE delivery_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  outbox_id TEXT NOT NULL REFERENCES outbox(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL CHECK (attempt_number >= 1),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'webhook')),
  outcome TEXT NOT NULL CHECK (outcome IN ('accepted', 'retryable', 'permanent', 'dead_letter')),
  http_status INTEGER,
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  error_category TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (outbox_id, attempt_number)
);

CREATE TABLE demo_grants (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  product_id TEXT NOT NULL,
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  expires_at TEXT NOT NULL,
  single_use INTEGER NOT NULL DEFAULT 1 CHECK (single_use = 1),
  redeemed_at TEXT,
  revoked_at TEXT,
  revocation_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX demo_grants_lead ON demo_grants(lead_id);
CREATE INDEX demo_grants_product ON demo_grants(product_id, created_at);
