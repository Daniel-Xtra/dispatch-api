# Implementation Roadmap

Work **one phase at a time**. Do not start the next phase until the current phase is implemented and verified.

## Phases

| Phase | Focus | Exit criteria |
|-------|--------|---------------|
| **0** | Product definition + architecture | Architecture approved |
| **0b** | Canonical docs under `docs/` + ADRs 001–010 | Docs present in repo |
| **1** | Nest module skeleton + Compose + config + dual entrypoints | Empty modules boot |
| **2** | Domain contracts + state machine types (ports/interfaces, no HTTP yet) | Unit tests for transitions + port mocks |
| **3** | TypeORM entities + migrations + indexes | Migrate up on Compose Postgres |
| **4** | Tenants + API key auth + tenant context guard | Authenticated hello + isolation tests |
| **5** | Notification accept API (DTO contract + persist + outbox row) | `POST` returns `202` + id; OpenAPI documents shape |
| **6** | Outbox relay + publisher confirms | Row → RabbitMQ reliably |
| **7** | Finalize topology, DLQ, retry queues | Topology declared in code |
| **8** | Email worker claim/hydrate/status updates | E2E with mock provider |
| **9** | Resend adapter (implements `EmailProvider` contract) | Contract tests + real send in staging |
| **10** | Retry classification + backoff + DLQ | Failure tests pass |
| **11** | Templates versioning + render | Template E2E |
| **12** | Harden idempotency (concurrent) | Race tests |
| **13** | Metrics, Grafana dashboards, correlation IDs | Golden signals visible |
| **14** | Webhooks | After email path is prod-stable |
| **15** | SMS | After email proven |
| **16** | Push | After email proven |
| **17** | Dashboard | Optional; API-first may suffice |
| **18** | VPS deploy pipeline | Immutable tags + migrate + health |
| **19** | Load testing | Queue depth + accept latency |
| **20** | Security hardening | Key rotation, secret encryption audit |

## Current status

- Phase **0** — approved
- Phase **0b** — complete (`docs/` + ADRs 001–010)
- Phase **1** — complete (module skeleton, Compose, config, dual entrypoints)
- Phase **2+** — not started (next: domain model + state machine types)

## Rules

1. No notification feature code until Phase 5 (after auth and schema).
2. **Contract before implementation** at every boundary (see [contracts.md](./contracts.md)).
3. Prefer teaching-quality ADRs and tests over speculative abstractions.
4. Challenge over-engineering at each phase gate.
