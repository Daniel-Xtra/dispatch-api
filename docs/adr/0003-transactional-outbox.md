# ADR-003 Transactional Outbox

## Status

Accepted

## Context

Classic failure:

```text
Database transaction succeeds
        →
Application crashes
        →
RabbitMQ message never published
```

Accepted notifications must not disappear.

## Decision

Use the **transactional outbox** pattern:

1. In the same Postgres transaction as creating the Notification (and IdempotencyRecord), insert an `outbox_messages` row
2. A relay polls pending rows with `FOR UPDATE SKIP LOCKED`
3. Relay publishes to RabbitMQ with publisher confirms
4. Marks the outbox row `published`

**Polling** initially — not CDC.

## Alternatives

| Option | Trade-off |
|--------|-----------|
| Dual write (DB then MQ, no outbox) | Message loss on crash — rejected |
| CDC / Debezium | Excellent at scale; more moving parts than MVP needs |
| Listen/notify only | Soft signal; still need durable outbox rows for reliability |
| Inbox-only / poll notifications table | Couples dispatch to notification schema; outbox is clearer for multiple event types later |

## Trade-offs

- **Gain:** “Accepted ⇒ eventually published” without distributed transactions
- **Lose:** Slight publish lag (seconds); duplicate publish possible (handled by consumers)

## Consequences

- Outbox schema and relay are mandatory for Phase 6
- Duplicate publishes are expected under at-least-once; workers must be idempotent
- Cleanup job deletes old published outbox rows
- Revisit CDC if poll lag or DB load becomes a measured problem
