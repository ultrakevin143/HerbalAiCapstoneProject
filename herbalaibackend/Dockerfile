# Base stage
FROM node:22-alpine AS base
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build || true

# Production runner
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app ./

EXPOSE 5000
CMD ["npm", "run", "dev"]
