# Stage 1: Install dependencies
FROM node:20-alpine AS installer
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@9.x

WORKDIR /app

# Copy lockfiles and manifests for caching dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/database/package.json ./packages/database/
COPY apps/web/package.json ./apps/web/

# Install workspace dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Build the Next.js application
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@9.x

WORKDIR /app

# Copy cached dependencies and configuration
COPY --from=installer /app ./
COPY . .

# Generate Prisma Client and build standalone output
RUN pnpm run db:generate
RUN pnpm --filter web build

# Stage 3: Running the Next.js production server
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root system user for secure container execution
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static public assets
COPY --from=builder /app/apps/web/public ./apps/web/public

# Copy built standalone server bundle and dependencies (traced automatically by Next.js)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
