# Domain Model

Only entities required for a reliable multi-tenant email MVP are included. Deferred concepts are listed at the end.

## Store choices

| Store | Holds |
|-------|--------|
| PostgreSQL | System of record: tenants, notifications, attempts, templates, outbox, idempotency, provider config |
| Redis | Live rate-limit tokens; optional short-lived caches later |
| RabbitMQ | Transient dispatch messages (IDs only) — not source of truth |

## MVP entities

### Tenant

**Why:** Isolation root for every application/organization using the platform.

**Lifecycle:** Created by platform admin → `active` → optionally `suspended` / `deleted` (soft).

**Relationships:** 1→N ApiCredential, Template, Notification, ProviderConfig.

**Store:** PostgreSQL.

---

### ApiCredential

**Why:** Public API authentication without storing recoverable secrets.

**Lifecycle:** Created (plaintext key shown once) → active → rotated/revoked.

**Constraints:**
- Store `key_prefix` + `key_hash` only (never plaintext)
- Indexed by `key_prefix` for lookup, verified by hash comparison

**Store:** PostgreSQL.

---

### Notification

**Why:** Accepted client intent and lifecycle owner.

**Lifecycle:** See [notification-lifecycle.md](./notification-lifecycle.md).

**Key fields:** `tenant_id`, `channel`, `recipient`, `template_key`, `template_version_id`, `variables`, `status`, `idempotency_key`, `correlation_id`, `next_attempt_at`, version column for optimistic claim.

**Constraints:**
- Partial unique: `(tenant_id, idempotency_key)` where key is not null
- Indexes: `(tenant_id, created_at DESC)`, `(tenant_id, status)`, `(status, next_attempt_at)`

**Store:** PostgreSQL. Retention: 90 days hot (initial policy).

---

### NotificationAttempt

**Why:** Evidence of each provider call; supports retries, debugging, and ambiguous timeout handling.

**Lifecycle:** Created when a send is attempted → terminal attempt status (`succeeded`, `failed`, `ambiguous`, etc.).

**Constraints:** Unique `(notification_id, attempt_no)`; always includes `tenant_id` for isolation and queries.

**Store:** PostgreSQL. Same retention as notifications.

**Note:** There is no separate `Delivery` entity. Attempt rows cover delivery evidence for MVP.

---

### Template + TemplateVersion

**Why:** Versioned, channel-specific content with safe publish/rollback.

**Lifecycle:**
- Template created with key + channel
- Versions created as `draft`
- One version published → `published_version_id` on Template
- Rollback = publish an older version

**Constraints:** Unique `(tenant_id, key, channel)`; unique `(template_id, version)`.

**Store:** PostgreSQL.

**Rendering:** Handlebars (`{{name}}`). Missing required variables and render failures are permanent (or policy-defined) failures — not silent provider sends with empty content.

---

### OutboxMessage

**Why:** Reliably bridge “DB commit succeeded” to “RabbitMQ publish happened.”

**Lifecycle:** `pending` → `published` (or `failed` after relay errors); cleaned up after retention.

**Accept transaction:** Notification + OutboxMessage (+ IdempotencyRecord) in one TX.

**Relay:** Poll with `FOR UPDATE SKIP LOCKED`; publish with confirms; mark published.

**Store:** PostgreSQL. Retention: delete after published + 7 days.

See [ADR-003](./adr/0003-transactional-outbox.md).

---

### IdempotencyRecord

**Why:** Prevent duplicate notifications from client retries and concurrent duplicate requests.

**Lifecycle:** `in_progress` → `completed` (stores response for replay) → expire.

**Constraints:** Unique `(tenant_id, key)`.

**TTL:** 24–72 hours.

**Concurrency:** Insert `in_progress` first; unique violation → wait for completion and replay, or return conflict guidance.

**Store:** PostgreSQL.

---

### ProviderConfig

**Why:** Bind channel → adapter (and encrypted secrets) per tenant, with platform defaults.

**Lifecycle:** Created/activated; ordered by `priority` for future failover (MVP uses primary only).

**Fields:** `tenant_id` nullable for platform default, `channel`, `adapter`, `priority`, `encrypted_secrets`, `is_active`.

**Store:** PostgreSQL. Secrets encrypted at rest; never logged in plaintext.

---

### UsageCounter (daily rollup)

**Why:** Foundation for quotas and later billing without writing a fine-grained usage event per send on day one.

**Store:** PostgreSQL for rollups; Redis for live rate limiting (separate concern).

## Relationships (summary)

```text
Tenant
  ├── ApiCredential*
  ├── Template* ── TemplateVersion*
  ├── Notification* ── NotificationAttempt*
  ├── ProviderConfig*
  ├── OutboxMessage*
  └── IdempotencyRecord*
```

Accept path TX writes: **Notification + OutboxMessage + IdempotencyRecord**.

## Logical schema sketch

```text
tenants(id, slug UNIQUE, status, created_at)

api_credentials(id, tenant_id, key_prefix, key_hash, name, last_used_at, revoked_at, created_at)
  INDEX (key_prefix)

notifications(
  id, tenant_id, channel, recipient, template_key, template_version_id,
  variables JSONB, status, idempotency_key NULL,
  provider_used, correlation_id, created_at, updated_at, next_attempt_at, version
)
  UNIQUE (tenant_id, idempotency_key) WHERE idempotency_key IS NOT NULL
  INDEX (tenant_id, created_at DESC)
  INDEX (tenant_id, status)
  INDEX (status, next_attempt_at)

notification_attempts(
  id, notification_id, tenant_id, attempt_no, provider,
  status, provider_message_id, error_code, error_message,
  request_meta JSONB, response_meta JSONB, started_at, finished_at
)
  UNIQUE (notification_id, attempt_no)
  INDEX (tenant_id, created_at)

templates(id, tenant_id, key, channel, published_version_id)
  UNIQUE (tenant_id, key, channel)

template_versions(id, template_id, version, subject, body, status, created_at)
  UNIQUE (template_id, version)

outbox_messages(
  id, tenant_id, aggregate_type, aggregate_id, event_type, payload JSONB,
  status, created_at, published_at, attempts
)
  INDEX (status, created_at)

idempotency_records(
  id, tenant_id, key, request_hash, response_code, response_body JSONB,
  notification_id, status, created_at, expires_at
)
  UNIQUE (tenant_id, key)

provider_configs(
  id, tenant_id NULL, channel, adapter, priority, encrypted_secrets, is_active
)
```

## TypeORM notes

- Entities as decorated classes; **explicit migrations** only (`synchronize: false` outside throwaway local experiments)
- Shared `DataSource` for API and worker
- Accept path: `QueryRunner` / transactional entity manager
- Outbox claim: raw SQL `FOR UPDATE SKIP LOCKED`
- Worker claim races: `@VersionColumn()` on notifications

See [ADR-008](./adr/0008-typeorm.md).

## Tenant isolation vulnerabilities

Watch for:

1. Queries missing `tenant_id` in `WHERE`
2. Admin endpoints without role checks
3. `GET` by id without tenant filter (cross-tenant leak)
4. Redis keys without tenant (or global) prefix discipline
5. Logs that include another tenant’s PII due to missing context filters

## Deferred entities (not MVP)

| Concept | Why deferred |
|---------|----------------|
| Webhook / WebhookDelivery | After email path is production-stable |
| NotificationPreference | Product complexity; not required for transactional MVP |
| Delivery (separate from Attempt) | Redundant with NotificationAttempt |
| RateLimit as DB table | Redis + config is enough |
| Fine-grained UsageRecord events | Daily rollups suffice until billing |

## Retention (initial)

| Data | Retention |
|------|-----------|
| Notifications + attempts | 90 days hot |
| Outbox rows | Published + 7 days |
| Idempotency keys | 24–72 hours |
| Application logs | Per Loki/ops policy |
