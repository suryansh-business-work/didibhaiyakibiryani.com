# syntax=docker/dockerfile:1

# ── Export the Expo app to a static web bundle ───────────────────
# node:20 (glibc) is used so Expo's asset pipeline (sharp) works.
FROM node:20-slim AS build
WORKDIR /app
ARG EXPO_PUBLIC_API_URL=https://server.didibhaiyakibiryani.com/graphql
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV NODE_ENV=production
ENV CI=1
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npx expo export --platform web --output-dir dist

# ── Serve with nginx (SPA fallback) ──────────────────────────────
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3003
