# ADR-009 Redis Token Bucket Rate Limiting

## Status

Accepted

## Context

Multi-tenant SaaS must protect itself and downstream providers from abusive or accidental floods. Limits must work across multiple API processes.

## Decision

Use **Redis** with a **token bucket** algorithm for distributed tenant-level rate limiting (channel limits later).

## Alternatives

| Algorithm | Trade-off |
|-----------|-----------|
| Fixed window | Simple; bursty at window edges |
| Sliding window | Smoother; more Redis ops / memory |
| Leaky bucket | Similar shaping to token bucket |
| Token bucket | **Chosen** — clear burst allowance + steady refill |
| DB-only counters | Extra load on Postgres; weaker fit for hot path |

## Trade-offs

- **Gain:** Fast, distributed, predictable burst behavior
- **Lose:** Redis becomes critical for accept path fairness (fail policy must be explicit: fail closed or open — prefer fail closed for paid abuse protection)

## Consequences

- Rate limit keys are tenant-scoped
- `429` responses with standard error envelope
- Provider-level and endpoint-level limits can reuse the same mechanism later
