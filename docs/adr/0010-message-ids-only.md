# ADR-010 Broker Messages Contain IDs Only

## Status

Accepted

## Context

If RabbitMQ messages carry full notification payloads (template body, variables, secrets), they can go stale when templates are published or data is corrected, and they increase leak surface in broker tools/logs.

## Decision

Broker messages carry **references only**:

```json
{
  "notificationId": "...",
  "tenantId": "...",
  "correlationId": "...",
  "attempt": 1
}
```

Workers **hydrate** from PostgreSQL before rendering and sending.

## Alternatives

| Option | Trade-off |
|--------|-----------|
| Full payload in message | Faster worker (no DB read); stale data and larger leak surface |
| Payload + version stamp | More complex invalidation rules |

## Trade-offs

- **Gain:** Single source of truth; safer; simpler reasoning under retries
- **Lose:** Extra DB read per consume (acceptable at MVP scale)

## Consequences

- Outbox payload may mirror the same ID envelope
- Workers must handle missing/terminal notifications gracefully (ack/skip)
- Template publish after accept uses the version pinned on the notification row when accepted
