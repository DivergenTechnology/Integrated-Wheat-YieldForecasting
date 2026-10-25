# Dockerfile for the IWCYES-IWSS Dashboard
# Standard Next.js build (no standalone output)

# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json bun.lock* package-lock.json* ./

# Install dependencies — try npm first (universal), fall back gracefully
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the Next.js app
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy only what's needed for production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]
