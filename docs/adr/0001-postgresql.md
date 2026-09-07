# ADR-001 PostgreSQL as Primary Database

## Status

Accepted

## Context

The platform needs a durable system of record for tenants, notifications, attempts, templates, outbox rows, and idempotency keys. Accept path requires multi-row ACID transactions.

## Decision

Use **PostgreSQL** as the primary database and source of truth for all durable domain state.

## Alternatives

| Option | Why not (now) |
|--------|----------------|
| MongoDB | Weaker fit for relational constraints, partial unique indexes, and transactional outbox patterns we rely on |
| MySQL | Viable, but team/stack preference and Postgres JSONB + partial unique indexes are a better fit |
| DynamoDB / specialty stores | Operational complexity and query model mismatch for MVP on a VPS |

## Trade-offs

- **Gain:** Strong transactions, mature tooling, excellent fit for outbox + idempotency uniqueness
- **Lose:** Vertical scaling limits eventually; sharding is a later problem

## Consequences

- All accept-path consistency depends on Postgres transactions
- Redis and RabbitMQ are not sources of truth for notification intent
- Schema evolves via explicit migrations (see ADR-008)
