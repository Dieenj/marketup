# Stage 1: Install dependencies
FROM node:20-alpine AS installer
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@9.x

WORKDIR /app

# Copy lockfiles and manifests for caching dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/

# Install workspace dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Build the NestJS application
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@9.x

WORKDIR /app

# Copy cached dependencies and configuration
COPY --from=installer /app ./
COPY . .

# Generate Prisma Client and build the API
RUN pnpm run db:generate
RUN pnpm --filter api build

# Prune devDependencies to keep the production image lightweight
RUN pnpm install --prod --ignore-scripts

# Stage 3: Running the NestJS production server
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy pruned workspace node_modules and prisma client
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database

# Copy built API dist folder and package JSON
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3001

CMD ["node", "apps/api/dist/main"]
