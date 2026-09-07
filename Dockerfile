# syntax=docker/dockerfile:1

ARG PNPM_VERSION=9.15.9

FROM node:22-alpine AS deps
ARG PNPM_VERSION
WORKDIR /app

# Pin pnpm so Corepack does not pull an unexpected major at build time.
RUN corepack enable \
  && corepack prepare "pnpm@${PNPM_VERSION}" --activate

# Flaky/slow registry.npmjs.org (common on some networks/VPS):
# more retries, longer timeout, lower concurrency.
RUN pnpm config set fetch-retries 5 \
  && pnpm config set fetch-retry-mintimeout 20000 \
  && pnpm config set fetch-retry-maxtimeout 120000 \
  && pnpm config set fetch-timeout 600000 \
  && pnpm config set network-concurrency 4

COPY package.json pnpm-lock.yaml ./

# Persist the pnpm store across builds so retries do not re-download everything.
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
  pnpm install --frozen-lockfile

FROM node:22-alpine AS build
ARG PNPM_VERSION
WORKDIR /app
RUN corepack enable \
  && corepack prepare "pnpm@${PNPM_VERSION}" --activate

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./
COPY . .
RUN pnpm run build
RUN pnpm prune --prod

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S dispatch && adduser -S dispatch -G dispatch
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
USER dispatch
EXPOSE 3000
CMD ["node", "dist/main.js"]
