# Dispatch API

A multi-tenant **Notification-as-a-Service** platform. External applications send transactional notifications through one HTTP API without owning provider integrations, retries, templates, queues, or delivery tracking.

```http
POST /v1/notifications
```

```json
{
  "channel": "email",
  "recipient": "user@example.com",
  "template": "welcome",
  "variables": { "name": "Daniel" }
}
```

The client never needs to know which provider sends the message, how retries work, or how failures are handled. Those concerns belong to the platform.

## Status

Phase 1 complete — modular monolith skeleton with dual entrypoints, validated config, and a Docker Compose stack. Phase 2 (domain contracts and the notification state machine) is next.

Full phase list: [docs/roadmap.md](docs/roadmap.md).

## Stack

| Concern | Choice |
|---------|--------|
| Framework | NestJS + TypeScript |
| System of record | PostgreSQL + TypeORM (explicit migrations) |
| Async dispatch | RabbitMQ (transactional outbox) |
| Rate limiting | Redis (token bucket) |
| Deployment | Docker Compose on a Linux VPS; Nginx on the host |

Delivery is **at-least-once**. Exactly-once is not promised across external providers — see [docs/failure-modes.md](docs/failure-modes.md).

## Quick start

```bash
cp .env.example .env
pnpm install

pnpm run start:dev          # API on :3000
pnpm run start:worker:dev   # Worker (separate terminal)
```

Verify the API:

```bash
curl http://localhost:3000/health
```

### Docker Compose

```bash
docker compose up --build
```

Compose reads all credentials and `NODE_ENV` from `.env` (defaults to `development`). Secrets are never hardcoded in `docker-compose.yml`.

For faster iteration, run only the infrastructure in Docker and the app processes locally:

```bash
docker compose up -d postgres redis rabbitmq
pnpm run start:dev
```

### Tests

```bash
pnpm test
pnpm run test:e2e
```

## Project structure

Two processes, one codebase. The API never waits on external providers.

```text
src/
  main.ts              # API process
  worker.ts            # Delivery worker process
  contracts/           # API DTOs, domain ports, message types
  modules/             # identity, notifications, templates, providers, outbox, rate-limits
  infrastructure/      # database, rabbitmq, redis, provider-adapters
  common/
  config/
docs/                  # architecture, domain model, ADRs
```

Vendor SDKs live only in `infrastructure/provider-adapters`. Domain code depends on interfaces, never on Resend, Twilio, or SES directly.

## Documentation

- [Architecture](docs/README.md) — system context, data flow, deployment
- [Domain model](docs/domain.md) — entities, indexes, retention
- [Notification lifecycle](docs/notification-lifecycle.md) — state machine
- [RabbitMQ topology](docs/rabbitmq.md) — queues, retries, DLQ
- [Failure modes](docs/failure-modes.md) — timeouts, duplicates, backpressure
- [Contracts](docs/contracts.md) — contract-first boundaries
- [ADRs](docs/adr/README.md) — decision records

## License

UNLICENSED — private project.
