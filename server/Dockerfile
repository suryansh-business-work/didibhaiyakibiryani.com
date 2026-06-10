# syntax=docker/dockerfile:1

# ── Compile TypeScript → dist/ ───────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Runtime (production deps only) ───────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Apollo/Express listens on $PORT (set to 3001 via compose)
EXPOSE 3001
CMD ["node", "dist/index.js"]
