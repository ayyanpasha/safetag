FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/service-utils/package.json packages/service-utils/
COPY packages/prisma-config/package.json packages/prisma-config/
COPY services/affiliate/package.json services/affiliate/
COPY services/affiliate/src/prisma/ services/affiliate/src/prisma/
RUN pnpm install --no-frozen-lockfile

FROM base AS build
COPY --from=deps /app/ ./
COPY tsconfig.base.json ./
COPY packages/ packages/
COPY services/affiliate/ services/affiliate/
RUN pnpm --filter @safetag/affiliate run build
RUN ./node_modules/.bin/prisma generate --schema=services/affiliate/src/prisma/schema.prisma

FROM base AS runner
COPY --from=build /app/ ./
WORKDIR /app/services/affiliate
EXPOSE 3006
CMD ["node", "dist/index.js"]
