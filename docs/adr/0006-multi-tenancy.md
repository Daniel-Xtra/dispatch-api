# ADR-006 Multi-Tenancy Strategy

## Status

Accepted

## Context

Every external application is a tenant with isolated notifications, templates, credentials, provider config, rate limits, and usage.

## Decision

Use a **shared PostgreSQL database** with **`tenant_id` on every tenant-owned row**.

Resolve tenant from the API key; never from a client-supplied tenant id in the body.

Redis keys include tenant (or global platform) prefixes.

## Alternatives

| Option | Trade-off |
|--------|-----------|
| Schema-per-tenant | Strong isolation; painful migrations and connection management at our scale |
| Database-per-tenant | Strong isolation; heavy ops for 1–10 (and even 100) tenants |
| Shared tables without tenant_id discipline | Leak risk — rejected |

## Trade-offs

- **Gain:** Simple ops, one migration path, fits MVP scale
- **Lose:** Application bugs can cause cross-tenant leaks; requires rigorous query discipline and tests

## Consequences

- Repository APIs require `tenantId`
- Isolation tests are mandatory in Phase 4
- Documented leak vectors in domain.md
- Row-Level Security may be considered later as defense-in-depth, not a day-one requirement
