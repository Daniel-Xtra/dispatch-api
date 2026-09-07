# Contract-Based Implementation

Implementation follows a **contract-first** model: define boundaries explicitly, implement against them, and test that implementations honor the contract.

This is not ceremony for its own sake. It keeps the API, domain, workers, and provider adapters decoupled so each layer can evolve and be tested independently.

## What counts as a contract

| Layer | Contract | Location (planned) | Verified by |
|-------|----------|-------------------|-------------|
| Public HTTP API | OpenAPI + request/response DTOs | `src/contracts/api/` + `@nestjs/swagger` | E2E, schema validation |
| Domain ports | TypeScript interfaces | `src/contracts/domain/` | Unit tests, mocks |
| Provider adapters | Port implementations | `src/infrastructure/provider-adapters/` | Contract tests |
| Queue messages | Typed message envelope | `src/contracts/messaging/` | Integration tests |
| Error responses | Standard error envelope | `src/contracts/api/errors.ts` | E2E |

Postgres schema (TypeORM entities + migrations) is the **persistence contract** — defined in Phase 3, not duplicated elsewhere.

## Rules

1. **Define the contract before the implementation** for any boundary (HTTP handler, provider adapter, queue consumer).
2. **Domain and application code depend on interfaces**, not concrete adapters or vendor SDKs.
3. **DTOs enforce the HTTP contract at runtime** via `class-validator` / `class-transformer`.
4. **OpenAPI is generated from Nest decorators** (or kept in sync with DTOs) — clients and docs share one truth.
5. **Contract tests** prove adapters satisfy ports; **integration tests** prove the full path honors message and API contracts.
6. **No leaking vendor types** across module boundaries (Resend response shapes stay inside the adapter).

## Public API contract

```text
OpenAPI spec  ←→  DTO classes  ←→  Controller  ←→  Application service
```

- Request bodies, query params, and responses are typed DTOs.
- Error shape is fixed (see [api-overview.md](./api-overview.md)).
- Breaking API changes require `/v2` — contracts are versioned with the URL prefix.

## Domain port contract

Example (email channel):

```typescript
export interface EmailProvider {
  send(message: EmailMessage): Promise<ProviderResult>;
}
```

- `ProvidersModule` selects an implementation; it never imports Resend.
- Mock providers in tests implement the same port — no HTTP mocking of vendor APIs in domain tests.

See [ADR-005 Provider abstraction](./adr/0005-provider-abstraction.md).

## Messaging contract

Broker messages carry IDs only:

```typescript
export interface DispatchMessage {
  notificationId: string;
  tenantId: string;
  correlationId: string;
  attempt: number;
}
```

Workers deserialize to this type before hydrating from Postgres. See [ADR-010](./adr/0010-message-ids-only.md).

## Phase alignment

| Phase | Contract work |
|-------|----------------|
| **2** | Domain types, state machine, port interfaces |
| **3** | Entity schema as persistence contract |
| **5** | Notification accept DTOs + OpenAPI |
| **8–9** | Provider port + contract tests for email adapter |
| **11** | Template DTOs + render input contract |

## What we avoid

- Implementing controllers or adapters before the interface/DTO exists
- Passing raw `any` or vendor SDK types through domain services
- Duplicating the same shape in three places without a single source (DTO ↔ OpenAPI stay linked via Nest/Swagger)

See [ADR-011 Contract-based implementation](./adr/0011-contract-based-implementation.md).
