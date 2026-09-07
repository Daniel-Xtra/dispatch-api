# ADR-002 RabbitMQ as Message Broker

## Status

Accepted

## Context

After accepting a notification, delivery must be asynchronous. We need durable queues, retries, dead-lettering, and independent worker scaling.

## Decision

Use **RabbitMQ** with a topic exchange, per-channel work queues, TTL retry queues, and a DLX/DLQ.

## Alternatives

| Option | Trade-off |
|--------|-----------|
| Amazon SQS / cloud queues | Fine later on cloud; heavier coupling for initial VPS Compose |
| Redis Streams / BullMQ | Simpler ops for some teams; weaker first-class DLX/routing vs Rabbit for our topology teaching goals |
| Kafka | Overkill for 10k–100k/day transactional notify; higher ops cost |
| Sync HTTP to provider | Rejected — see architecture.md |

## Trade-offs

- **Gain:** Explicit routing, DLX, mature consumer ack semantics, easy Compose install
- **Lose:** Another stateful dependency to operate and monitor

## Consequences

- Outbox relay publishes with confirms
- Workers use manual ack
- Topology documented in [rabbitmq.md](../rabbitmq.md)
- Attempt counts remain in Postgres, not only in the broker
