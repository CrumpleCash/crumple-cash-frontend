# syntax=docker.io/docker/dockerfile:1

# Base image using Alpine
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Enable Corepack and prepare correct Yarn version
RUN corepack enable && corepack prepare yarn@4.9.1 --activate

# Stage for installing dependencies
FROM base AS deps

# Optional: needed for some Node.js native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package manager and lock/config files
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* \
     .npmrc* .yarnrc.yml .yarn/ ./

# Install dependencies based on lockfile type
RUN \
  if [ -f yarn.lock ]; then yarn install --immutable; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
  else echo "No lockfile found." && exit 1; \
  fi

# Stage for building the app
FROM base AS builder

WORKDIR /app

# Copy node_modules and yarn config from deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.yarn ./\.yarn
COPY --from=deps /app/.yarnrc.yml ./
COPY . .

# Build the app
RUN \
  if [ -f yarn.lock ]; then yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "No lockfile found." && exit 1; \
  fi

# Final production image
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nextjs -G nodejs

# Copy necessary files from build stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
