# ── Stage 1: Dependencies ──────────────────────────────────────────────────────
FROM node:20-alpine AS deps

# Set working directory
WORKDIR /app

# Copy only package files first — Docker layer cache means npm install
# only re-runs when package.json actually changes, not on every code edit.
COPY package.json package-lock.json* ./

RUN npm ci --only=production

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 expressjs

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY --chown=expressjs:nodejs . .

USER expressjs

EXPOSE 5000

# Use node directly (not npm start) — avoids npm signal-handling quirks.
# SIGTERM from Docker/Kubernetes reaches the Node process correctly.
CMD ["node", "src/server.js"]
