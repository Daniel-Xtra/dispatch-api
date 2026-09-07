# Phase 1 — Scaffold

Phase 1 establishes the modular monolith shape without domain logic yet.

## What exists

- Dual entrypoints: `src/main.ts` (API) and `src/worker.ts` (worker)
- Modules under `src/modules/*` (empty shells)
- Infrastructure stubs under `src/infrastructure/*` (config-aware, not connected)
- Validated env via `@nestjs/config` + Joi
- Docker Compose: Postgres, Redis, RabbitMQ, API, worker (Nginx on the host server, not in Compose)
- `GET /health` on the API

## Local commands

```bash
cp .env.example .env
pnpm install
pnpm run start:dev          # API
pnpm run start:worker:dev   # Worker (separate terminal)
pnpm run build
pnpm test
pnpm run test:e2e
```

## Compose

```bash
docker compose up --build
# API:          http://localhost:3000/health
# RabbitMQ UI:  http://localhost:${RABBITMQ_MANAGEMENT_PORT:-15672}
#               (credentials from RABBITMQ_USER / RABBITMQ_PASSWORD in .env)
```

Compose reads secrets and `NODE_ENV` from `.env` (default: `development`). Do not put secrets in `docker-compose.yml`. Hostnames `postgres` / `redis` / `rabbitmq` are set only for containers on the Docker network; local `pnpm` processes keep `localhost` from `.env`.

### Docker build: `ETIMEDOUT` on registry.npmjs.org

The Dockerfile already raises pnpm fetch retries/timeouts and uses a BuildKit cache for the pnpm store. If installs still fail:

1. Retry — many failures are transient registry/network timeouts.
2. Ensure BuildKit is on: `DOCKER_BUILDKIT=1 docker compose build`
3. Check host DNS/VPN/firewall can reach `registry.npmjs.org` from inside containers.
4. For local iteration without rebuilding deps every time, run API/worker with `pnpm run start:dev` against Compose infra only:

```bash
docker compose up -d postgres redis rabbitmq
pnpm run start:dev
pnpm run start:worker:dev
```

Infra clients (TypeORM, amqplib, ioredis) are intentionally **not** connected yet — that starts in Phase 3+.

## Teaching note (worker keep-alive)

Until RabbitMQ consumers (or other open handles) exist, `NestFactory.createApplicationContext` has an empty Node event loop and the process exits. A pending Promise is not enough (especially on Windows). Phase 1 uses a `setInterval` keep-alive cleared on `SIGINT`/`SIGTERM`. Real consumers in Phase 8 will keep the process alive naturally.
