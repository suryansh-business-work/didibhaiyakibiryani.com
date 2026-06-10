# syntax=docker/dockerfile:1

# ── Build the Vite SPA (API URL baked at build time) ─────────────
FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_URL=https://server.didibhaiyakibiryani.com/graphql
ENV VITE_API_URL=$VITE_API_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Serve with nginx (SPA fallback) ──────────────────────────────
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3004
