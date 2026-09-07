# Dispatch API — Architecture Documentation

Canonical architecture for the multi-tenant **Notification-as-a-Service** platform.

This is not a thin notification microservice. It is infrastructure that many independent applications and organizations can consume for transactional email (MVP), with SMS and push planned later.

## Documents

| Document | Description |
|----------|-------------|
| [architecture.md](./architecture.md) | System context, containers, data flow, deployment, scale path |
| [domain.md](./domain.md) | Core entities, relationships, indexes, retention, store choices |
| [notification-lifecycle.md](./notification-lifecycle.md) | Status state machine and allowed transitions |
| [rabbitmq.md](./rabbitmq.md) | Broker topology, ack strategy, retries, DLQ |
| [failure-modes.md](./failure-modes.md) | Crash, timeout, duplicate, and backpressure scenarios |
| [api-overview.md](./api-overview.md) | Versioned REST surface, auth, errors, idempotency |
| [contracts.md](./contracts.md) | Contract-first boundaries (API, domain ports, messaging) |
| [mvp-scope.md](./mvp-scope.md) | What we build now vs what we defer |
| [roadmap.md](./roadmap.md) | Phased implementation (one phase at a time) |
| [phase-1-scaffold.md](./phase-1-scaffold.md) | Phase 1 scaffold notes and local commands |

## Architectural Decision Records

See [adr/](./adr/README.md) for ADR-001 through ADR-011.

## Stack (decided)

- NestJS + TypeScript
- PostgreSQL + TypeORM (explicit migrations)
- Redis (rate limiting)
- RabbitMQ (async dispatch)
- Docker Compose on a Linux VPS initially
- Prometheus + Grafana (+ Loki later)

## How to read these docs

Each major decision follows: **problem → simplest option → alternatives → trade-offs → choice**.

If something looks over-engineered for 10k–100k notifications/day, challenge it. If a reliability concern is under-engineered, harden it.
