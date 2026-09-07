# Failure Modes and Delivery Semantics

## Delivery semantics

| Semantic | Promise | Our stance |
|----------|---------|------------|
| At-most-once | May lose messages | Rejected for accepted notifications |
| At-least-once | May duplicate | **Chosen** — see [ADR-004](./adr/0004-at-least-once-delivery.md) |
| Exactly-once | No loss, no dup | Not promised end-to-end with external providers |

Clients and providers must tolerate rare duplicate sends. Prefer provider-side idempotency keys when available.

## Critical scenarios

| Scenario | Handling |
|----------|----------|
| API crash after DB commit, before broker publish | Outbox row remains `pending`; relay publishes later |
| Outbox published twice | Worker claim is idempotent; duplicate broker messages are safe |
| RabbitMQ unavailable | Outbox accumulates; API can still accept until backpressure/rate limits; alert on depth/age |
| Worker crash mid-send | Unacked redelivery; if provider may have accepted, mark attempt `ambiguous` |
| Provider timeout | **Not** a sure failure. Do not blind-failover. Cautious bounded retry with provider idempotency when possible |
| Provider 429 / 5xx / 502 / 503 | Retryable with exponential backoff |
| Provider 400 invalid recipient | Permanent → `dead_lettered` |
| Provider 401 / config error | Permanent for this config → `dead_lettered`; alert ops/tenant |
| Concurrent same `Idempotency-Key` | Unique constraint + `in_progress`; loser waits for replay or gets conflict guidance |
| Two workers, same message | Optimistic claim / version column; only winner sends |
| Two outbox relays, same row | `FOR UPDATE SKIP LOCKED` + published status; duplicate publish still OK at worker |
| PostgreSQL down | API fails closed (`503`); never silently accept |
| Ingress ≫ provider throughput | Queues absorb; monitor depth; tenant rate limits; eventually `429`/`503` at edge |

## Provider timeout ambiguity

```text
Worker                    Provider
  |                          |
  |------- send ------------>|
  |                          |  (provider may have accepted)
  |<---- timeout / network --|
  |
  ? Did it send or not?
```

**Wrong response:** Immediately switch to a secondary provider and send again (high double-send risk).

**Right response:**

1. Record attempt as `ambiguous` / `unknown`
2. Prefer retry with the **same** provider idempotency key if supported
3. Bound retries; surface metrics/alerts
4. Defer automatic multi-provider failover until idempotency is solid (out of MVP)

## Failure classification (retry policy)

| Class | Examples | Action |
|-------|----------|--------|
| Transient | 429, 500, 502, 503, connection reset | Retry with backoff |
| Timeout / unknown | HTTP timeout, reset after write | Ambiguous handling; cautious retry |
| Permanent client | Invalid recipient, bad template render | `dead_lettered` |
| Config / auth | 401, 403 from provider | `dead_lettered` + alert |
| Platform bug | Unexpected invariant | Fail attempt; alert; do not infinite loop |

## Backpressure

When incoming accept rate exceeds provider throughput:

1. RabbitMQ queue depth grows (expected shock absorber)
2. Outbox pending age grows if relay/broker is slow
3. Redis token bucket sheds at the API (`429`)
4. Ops alerts before disk/DB fill

Do not accept unbounded load into Postgres/outbox without limits.

## Consistency under failure

- **Strong:** Whether a notification was accepted and which idempotency key maps to it
- **Eventual:** Whether it has been `sent`
- Workers and relays must be safe under duplicate work
