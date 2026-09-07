# API Overview

Versioned public REST API. Implementation is **contract-based**: DTOs + OpenAPI define the HTTP boundary; controllers implement those contracts.

See [contracts.md](./contracts.md).
## Base

```text
https://{host}/v1
```

Authentication on all tenant routes:

```http
Authorization: Bearer {api_key}
```

API keys are shown once at creation; the platform stores only prefix + hash.

## Idempotency

For `POST /v1/notifications`:

```http
Idempotency-Key: {opaque-client-key}
```

- Scoped per tenant
- Stored in PostgreSQL with TTL (24–72h)
- Same key + same request hash → replay stored response
- Same key + different body → conflict error
- Concurrent same key → one winner; loser waits for completion or receives guidance to retry

## Core endpoints (MVP)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/v1/notifications` | Accept a notification (`202`) |
| `GET` | `/v1/notifications/:id` | Get one notification |
| `GET` | `/v1/notifications` | List (paginated, filterable) |
| `POST` | `/v1/templates` | Create template |
| `GET` | `/v1/templates` | List templates |
| `GET` | `/v1/templates/:id` | Get template |
| `PUT` | `/v1/templates/:id` | Update draft / metadata |
| `POST` | `/v1/templates/:id/versions` | Add version |
| `POST` | `/v1/templates/:id/publish` | Publish a version |
| `POST` | `/v1/api-keys` | Create API key |
| `GET` | `/v1/api-keys` | List keys (prefix only) |
| `DELETE` | `/v1/api-keys/:id` | Revoke key |

Platform-admin tenant provisioning may use separate protected routes (not public SaaS surface).

## Accept notification (shape)

```http
POST /v1/notifications
Idempotency-Key: 7b6f...
Authorization: Bearer ...
Content-Type: application/json
```

```json
{
  "channel": "email",
  "recipient": "user@example.com",
  "template": "welcome",
  "variables": {
    "name": "Daniel"
  }
}
```

**Response `202`:**

```json
{
  "id": "ntf_...",
  "status": "accepted",
  "channel": "email",
  "createdAt": "2026-08-24T23:00:00.000Z"
}
```

The API does **not** wait for the provider.

## List / filter / pagination

Initial conventions:

- Cursor or offset pagination (prefer cursor for large histories)
- Filter: `status`, `channel`, `created_from`, `created_to`
- Sort: `created_at` desc default
- Always scoped to authenticated tenant

## Error envelope

```json
{
  "error": {
    "code": "INVALID_RECIPIENT",
    "message": "The recipient address is invalid",
    "requestId": "req_123"
  }
}
```

### Error categories

| Category | HTTP | Examples |
|----------|------|----------|
| Client | 4xx | Validation, invalid recipient, bad template key |
| Auth | 401 / 403 | Missing/invalid key, revoked key |
| Rate limit | 429 | Token bucket exhausted |
| Conflict | 409 | Idempotency key reuse with different body |
| Infrastructure | 503 | Database unavailable |
| Domain | 4xx/422 | Illegal state transition (internal), unpublished template |

Provider failures after accept appear on the **notification status**, not as the accept HTTP error.

## Versioning

- URL prefix `/v1`
- Breaking changes require `/v2`
- Additive fields are non-breaking

## Out of MVP API surface

- Webhook CRUD and delivery logs
- SMS / push specific payloads beyond shared shape
- Preference center
- Dashboard-only BFF routes
