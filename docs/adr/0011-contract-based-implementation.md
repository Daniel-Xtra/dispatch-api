# ADR-011 Contract-Based Implementation

## Status

Accepted

## Context

The platform has multiple boundaries: public HTTP API, domain logic, queue messages, and external provider adapters. Without explicit contracts, implementations drift, vendor SDKs leak into domain code, and tests become brittle integration suites.

## Decision

Use **contract-based implementation** across all module boundaries:

1. **HTTP:** OpenAPI-aligned DTOs with runtime validation; controllers implement the documented contract.
2. **Domain:** TypeScript port interfaces (`EmailProvider`, repositories where useful); services depend on abstractions.
3. **Messaging:** Typed message envelopes for RabbitMQ payloads.
4. **Providers:** Adapters implement ports; **contract tests** verify behavior without calling real vendors in CI.

Contracts live under `src/contracts/` (api, domain, messaging). Implementations live in modules and infrastructure.

## Alternatives

| Option | Trade-off |
|--------|-----------|
| Code-first only, no formal contracts | Faster initially; boundaries blur; vendor coupling |
| OpenAPI-only, no shared TS types | Drift between spec and runtime |
| Heavy code generation from OpenAPI for everything | Strong sync; heavier toolchain for MVP |
| Microservice API contracts (Pact, etc.) | Overkill for modular monolith MVP |

## Trade-offs

- **Gain:** Clear boundaries, swappable adapters, testable domain, stable client surface
- **Lose:** Slightly more upfront structure; must keep DTOs and OpenAPI in sync

## Consequences

- Phase 2 introduces domain contracts and state machine types before HTTP handlers
- Phase 5+ adds API DTOs before controller logic
- Provider adapters require contract tests before production use
- Vendor SDK types never appear outside `infrastructure/provider-adapters`
