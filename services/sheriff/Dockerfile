FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/service-utils/package.json packages/service-utils/
COPY packages/prisma-config/package.json packages/prisma-config/
COPY services/sheriff/package.json services/sheriff/
COPY services/sheriff/src/prisma/ services/sheriff/src/prisma/
RUN pnpm install --no-frozen-lockfile

FROM base AS build
COPY --from=deps /app/ ./
COPY tsconfig.base.json ./
COPY packages/ packages/
COPY services/sheriff/ services/sheriff/
RUN pnpm --filter @safetag/sheriff run build
RUN ./node_modules/.bin/prisma generate --schema=services/sheriff/src/prisma/schema.prisma

FROM base AS runner
COPY --from=build /app/ ./
WORKDIR /app/services/sheriff
EXPOSE 3003
CMD ["node", "dist/index.js"]
