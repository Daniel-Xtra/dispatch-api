# ADR-005 Provider Abstraction

## Status

Accepted

## Context

Email/SMS/push vendors change. Tenants may use different providers. Business logic must not import Twilio/SendGrid/SES/Resend SDKs directly.

## Decision

Define **ports** per channel (e.g. `EmailProvider.send(...)`) in the domain/application layer.

Implement **adapters** under `infrastructure/provider-adapters` (Resend first).

Adapters must satisfy the port **contract** (interface + contract tests). See [ADR-011](./0011-contract-based-implementation.md).

Select provider via `ProviderConfig` (tenant override or platform default).

**MVP:** single active provider per tenant/channel. No automatic failover chain.

## Alternatives

| Option | Trade-off |
|--------|-----------|
| Call vendor SDK from services | Tight coupling; hard tests; vendor lock-in |
| Immediate multi-provider failover | Double-send risk on timeouts without strong idempotency |
| One global provider only, hardcoded | Too rigid for multi-tenant SaaS |

## Trade-offs

- **Gain:** Swappable vendors, testable with mocks, clear boundaries
- **Lose:** Small amount of indirection; mapping vendor errors to domain error classes

## Consequences

- Domain modules never import vendor SDKs
- Contract tests for adapters
- Failover is a later phase gated on provider idempotency support
