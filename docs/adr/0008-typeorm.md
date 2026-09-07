# ADR-008 TypeORM

## Status

Accepted

## Context

We need an ORM aligned with NestJS, explicit schema control, and transactional patterns (accept path, outbox, worker claims).

## Decision

Use **TypeORM** with `@nestjs/typeorm`.

- Entity classes co-located with modules
- Migrations under `infrastructure/database/migrations`
- `synchronize: false` outside throwaway local experiments
- Shared `DataSource` for API and worker

## Alternatives

| Option | Trade-off |
|--------|-----------|
| Prisma | Excellent DX; user preference is TypeORM; Nest integration differs |
| Knex / raw SQL only | Maximum control; more boilerplate for entities/relations |
| MikroORM | Viable; less common in this stack preference |

## Trade-offs

- **Gain:** Nest-native DI patterns, decorator entities, mature Postgres support
- **Lose:** Some advanced SQL (e.g. `SKIP LOCKED`) via raw queries; must avoid synchronize pitfalls

## Consequences

- Accept path uses `QueryRunner` / transactional entity manager
- Outbox locking uses raw SQL `FOR UPDATE SKIP LOCKED`
- Notifications use `@VersionColumn()` for optimistic worker claims
- CI runs migrations against Postgres in integration tests
