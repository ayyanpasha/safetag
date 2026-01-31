FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/service-utils/package.json packages/service-utils/
COPY packages/prisma-config/package.json packages/prisma-config/
COPY services/payment/package.json services/payment/
COPY services/payment/src/prisma/ services/payment/src/prisma/
RUN pnpm install --no-frozen-lockfile

FROM base AS build
COPY --from=deps /app/ ./
COPY tsconfig.base.json ./
COPY packages/ packages/
COPY services/payment/ services/payment/
RUN pnpm --filter @safetag/payment run build
RUN ./node_modules/.bin/prisma generate --schema=services/payment/src/prisma/schema.prisma

FROM base AS runner
COPY --from=build /app/ ./
WORKDIR /app/services/payment
EXPOSE 3005
CMD ["node", "dist/index.js"]
