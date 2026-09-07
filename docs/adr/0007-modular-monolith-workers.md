# ADR-007 Modular Monolith + Dedicated Workers

## Status

Accepted

## Context

We need HTTP accept latency decoupled from provider I/O, without the cost of many deployable microservices.

## Decision

Build a **modular monolith** (one NestJS codebase, clear modules) with **two processes**:

- API (`main.ts`)
- Worker (`worker.ts`)

Share domain and infrastructure modules. Split only the process entrypoint and which modules boot.

## Alternatives

| Option | Trade-off |
|--------|-----------|
| Single process HTTP + consumers | Simpler deploy; blast radius and scaling coupled |
| Many microservices (api, outbox, email, sms…) | Premature for 10k–100k/day; distributed complexity without payoff |
| Separate repos per process | Duplicated types, harder refactors |

## Trade-offs

- **Gain:** Independent scale/restart of workers; one domain model; low ops overhead
- **Lose:** Must be careful about module boundaries so the monolith does not rot

## Consequences

- Compose runs `api` and `worker` services from the same image
- No Kubernetes required for this decision
- Extract services only when a bounded context and scale demand it
