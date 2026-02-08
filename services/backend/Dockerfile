# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/service-utils/package.json ./packages/service-utils/
COPY packages/prisma-config/package.json ./packages/prisma-config/
COPY services/backend/package.json ./services/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/ ./packages/
COPY services/backend/ ./services/backend/

# Generate Prisma client
WORKDIR /app/services/backend
RUN pnpm db:generate

# Build TypeScript
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S safetag -u 1001

# Copy built files and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/backend/dist ./services/backend/dist
COPY --from=builder /app/services/backend/generated ./services/backend/generated
COPY --from=builder /app/services/backend/package.json ./services/backend/
COPY --from=builder /app/services/backend/src/prisma ./services/backend/src/prisma

# Set ownership
RUN chown -R safetag:nodejs /app

USER safetag

WORKDIR /app/services/backend

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "dist/index.js"]
