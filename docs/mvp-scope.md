# MVP Scope

Initial scale assumption: **1–10 tenants**, **10k–100k notifications/day**, single VPS Docker Compose.

## In scope (build)

- Tenants + API key auth (hash + prefix)
- `POST` / `GET` notifications — **email channel only**
- `Idempotency-Key` on accept
- Templates + versions (Handlebars), publish one version
- Transactional outbox + polling relay
- RabbitMQ email work queue + worker process
- One email adapter (**Resend**); port allows SES/SendGrid later
- Retry policy + DLQ for email
- NotificationAttempt logging + status state machine
- Tenant rate limiting (Redis token bucket)
- Docker Compose: API, worker, Postgres, Redis, RabbitMQ, Prometheus, Grafana (Nginx installed on the VPS, not in Compose)
- Structured logs + correlation IDs + core Prometheus metrics
- GitHub Actions: lint, test, build image
- Architecture docs + ADRs 001–011
- Contract-based boundaries (DTOs, domain ports, adapter contract tests)
- Unit + integration tests for outbox, idempotency, worker happy path

## Explicitly out of MVP

- SMS, Push, WhatsApp, in-app notifications
- Webhooks / bounce ingestion
- Multi-provider automatic failover
- Localization packs / preference center
- Tenant admin dashboard UI
- Kubernetes / cloud rewrite
- CDC-based outbox
- Schema-per-tenant
- Billing engine
- Exactly-once delivery guarantees
- Marketing / bulk campaign APIs

## Why this cut line

Reliability for **one channel** (email) with outbox, idempotency, and retries teaches the hard distributed-systems parts. Adding channels before those foundations multiply failure modes without increasing learning or production safety.
