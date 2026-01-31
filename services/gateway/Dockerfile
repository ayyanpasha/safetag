FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/service-utils/package.json packages/service-utils/
COPY packages/prisma-config/package.json packages/prisma-config/
COPY services/gateway/package.json services/gateway/
RUN pnpm install --no-frozen-lockfile

FROM base AS build
COPY --from=deps /app/ ./
COPY tsconfig.base.json ./
COPY packages/ packages/
COPY services/gateway/ services/gateway/
RUN pnpm --filter @safetag/gateway run build

FROM base AS runner
COPY --from=build /app/ ./
WORKDIR /app/services/gateway
EXPOSE 8080
CMD ["node", "dist/index.js"]
