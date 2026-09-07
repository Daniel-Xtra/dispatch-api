# RabbitMQ Topology

## Why a broker

The API must not wait on providers. After the accept transaction commits, work is dispatched asynchronously.

Postgres remains the source of truth. RabbitMQ is the **dispatch mechanism**.

See [ADR-002](./adr/0002-rabbitmq.md) and [ADR-010](./adr/0010-message-ids-only.md).

## Topology

Topic exchange + per-channel work queues + TTL retry queues + dead-letter exchange.

```text
Exchanges (durable):
  notification.events     # primary
  notification.retry      # retry staging
  notification.dlx        # dead letters

Queues:
  notification.email.work
  notification.sms.work          # declare now; consume later
  notification.push.work         # declare now; consume later
  notification.email.retry.30s
  notification.email.retry.2m
  notification.email.retry.10m
  notification.email.retry.30m
  notification.email.dlq

Routing keys:
  notification.email
  notification.sms
  notification.push
  notification.email.retry.<delay>
  notification.email.dead
```

## Message body

```json
{
  "notificationId": "uuid",
  "tenantId": "uuid",
  "correlationId": "uuid",
  "attempt": 1
}
```

**Do not** put full template bodies, variables, or secrets in the message.

The worker hydrates from PostgreSQL so broker payloads cannot go stale relative to template publishes or corrected data.

## Publishing

- Only the **outbox relay** publishes to `notification.events` in the steady state
- **Publisher confirms** are required
- Messages are **persistent**; queues are **durable**

Duplicate publishes are possible (at-least-once outbox). Workers must be idempotent on claim.

## Consumption

| Setting | Initial value | Notes |
|---------|---------------|-------|
| Ack mode | Manual | Ack only after DB attempt + status commit |
| Prefetch | 10 | Tune under load; prefer more worker replicas over huge prefetch |
| Concurrency | 1 process × prefetch | Scale out workers horizontally |

On crash before ack → broker redelivers → at-least-once.

## Retry strategy

Do **not** rely on infinite immediate `nack` requeue alone.

1. Classify failure (retryable vs permanent) — see [failure-modes.md](./failure-modes.md)
2. Persist attempt + update notification (`failed`, `next_attempt_at`, attempt count)
3. Publish to the appropriate TTL retry queue (or route via `notification.retry`)
4. After TTL, message returns to the work queue
5. After max attempts or permanent failure → `notification.email.dlq` and status `dead_lettered`

**Postgres remains source of truth for attempt count.** RabbitMQ delays are a scheduling aid, not the ledger.

### Suggested backoff (email MVP starting point)

| Attempt after failure | Delay |
|-----------------------|-------|
| 1 | 30 seconds |
| 2 | 2 minutes |
| 3 | 10 minutes |
| 4 | 30 minutes |
| then | DLQ |

Adjust with evidence; do not treat these as sacred.

## Why per-channel queues

| Approach | Trade-off |
|----------|-----------|
| Single shared queue | Simpler topology; slow SMS blocks email |
| Per-channel queues | Slightly more topology; isolate concurrency and failure domains |

**Choice:** Per-channel queues. Worth it once SMS/push exist; declare early so topology is stable.

## What not to do

- Store the only copy of notification intent in the broker
- Ack before the DB transaction that records the attempt succeeds
- Treat redelivery as a free “new send” without claim / attempt checks
- Implement retry **only** in RabbitMQ without attempt rows in Postgres
