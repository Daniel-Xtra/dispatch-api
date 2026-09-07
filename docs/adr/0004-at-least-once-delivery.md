# ADR-004 At-Least-Once Delivery

## Status

Accepted

## Context

Distributed systems retry. Brokers redeliver. Workers crash. Providers time out after accepting a message. Exactly-once across our API and an external email provider is not a free property.

## Decision

Guarantee **at-least-once** processing for accepted notifications:

- Outbox may publish more than once
- Consumers may see redeliveries
- Clients may rarely observe duplicate provider sends

Mitigate duplicates with:

- Tenant-scoped idempotency keys on accept
- Optimistic claim on notification rows
- Provider idempotency keys when the vendor supports them

Do **not** promise exactly-once end-to-end.

## Alternatives

| Option | Why not |
|--------|---------|
| At-most-once | Silent loss — unacceptable for transactional notify |
| Exactly-once claim | Misleading unless every hop participates in one atomic protocol (providers do not) |

## Trade-offs

- **Gain:** Honest reliability; no lost accepts due to process crashes
- **Lose:** Duplicate send risk must be designed for and monitored

## Consequences

- All consumers are idempotent on claim
- Provider timeouts treated as ambiguous (see failure-modes.md)
- Documentation and client guidance must mention duplicate tolerance
