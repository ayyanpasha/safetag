FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/service-utils/package.json packages/service-utils/
COPY packages/prisma-config/package.json packages/prisma-config/
COPY services/incident/package.json services/incident/
COPY services/incident/src/prisma/ services/incident/src/prisma/
RUN pnpm install --no-frozen-lockfile

FROM base AS build
COPY --from=deps /app/ ./
COPY tsconfig.base.json ./
COPY packages/ packages/
COPY services/incident/ services/incident/
RUN pnpm --filter @safetag/incident run build
RUN ./node_modules/.bin/prisma generate --schema=services/incident/src/prisma/schema.prisma

FROM base AS runner
COPY --from=build /app/ ./
WORKDIR /app/services/incident
EXPOSE 3007
CMD ["node", "dist/index.js"]
