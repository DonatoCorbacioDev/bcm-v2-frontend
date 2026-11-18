# Multi-stage build for Next.js application
# Stage 1: Dependencies
FROM node:26-alpine AS deps

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Stage 2: Builder
FROM node:26-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time argument for API URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:26-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user. npm, npx and corepack go: the server runs with node
# alone, and npm's own dependencies were the image's only known
# vulnerabilities (undici, brace-expansion; Trivy, 2026-11-18).
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

# Copy necessary files. Owned by root and read-only (555) to nextjs, which
# runs the server (OWASP Docker Security, non-root user): it can execute the
# app, not rewrite it. The root filesystem is read-only too (docker-compose.yml).
COPY --from=builder /app/public ./public
COPY --from=builder --chmod=555 /app/.next/standalone ./
COPY --from=builder --chmod=555 /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]