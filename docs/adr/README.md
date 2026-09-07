# Architectural Decision Records

ADRs capture significant decisions: context, choice, alternatives, trade-offs, and consequences.

## Index

| ADR | Title |
|-----|-------|
| [0001](./0001-postgresql.md) | PostgreSQL as primary database |
| [0002](./0002-rabbitmq.md) | RabbitMQ as message broker |
| [0003](./0003-transactional-outbox.md) | Transactional outbox |
| [0004](./0004-at-least-once-delivery.md) | At-least-once delivery |
| [0005](./0005-provider-abstraction.md) | Provider abstraction |
| [0006](./0006-multi-tenancy.md) | Multi-tenancy strategy |
| [0007](./0007-modular-monolith-workers.md) | Modular monolith + workers |
| [0008](./0008-typeorm.md) | TypeORM |
| [0009](./0009-redis-token-bucket.md) | Redis token bucket rate limiting |
| [0010](./0010-message-ids-only.md) | Broker messages contain IDs only |
| [0011](./0011-contract-based-implementation.md) | Contract-based implementation |

## Template

```markdown
# ADR-NNN Title

## Status

Accepted

## Context

What problem are we solving?

## Decision

What did we choose?

## Alternatives

What else did we consider?

## Trade-offs

What do we gain and lose?

## Consequences

What must be true going forward?
```
