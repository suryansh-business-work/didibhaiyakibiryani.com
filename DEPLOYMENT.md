# Deployment

Production runs on a single host (`148.135.136.107`). Four Docker containers sit
behind the host's **nginx**, which terminates TLS (Let's Encrypt via **certbot**)
and reverse-proxies each domain to a loopback port.

| Project | Container port | Host port (loopback) | Domain |
| ------- | -------------- | -------------------- | ------ |
| Website (Astro) | 3000 | `127.0.0.1:3000` | https://didibhaiyakibiryani.com |
| Server (GraphQL) | 3001 | `127.0.0.1:3001` | https://server.didibhaiyakibiryani.com |
| Admin (Vite SPA) | 3002 | `127.0.0.1:3002` | https://admin.didibhaiyakibiryani.com |
| Native (Expo web) | 3003 | `127.0.0.1:3003` | https://native.didibhaiyakibiryani.com |

Each container listens on its own port (1:1 mapping — no port translation).

```
 Internet ──▶ nginx (host, :443 TLS) ─┬─▶ 127.0.0.1:3000  ddb-website
                                       ├─▶ 127.0.0.1:3001  ddb-server
                                       ├─▶ 127.0.0.1:3002  ddb-admin
                                       └─▶ 127.0.0.1:3003  ddb-native
```

Containers bind to `127.0.0.1` only — they are not reachable from the internet
except through nginx.

## Files

```
docker-compose.yml                    # the 4-service production stack
website|server|admin|mobile-app/
  └── Dockerfile, .dockerignore, nginx.conf
deploy/
  ├── nginx/didibhaiyakibiryani.com   # single sites-available file (all 4 domains)
  ├── setup-server.sh                 # installs nginx/certbot/docker + SSL (idempotent)
  ├── healthcheck.sh                  # asserts all 4 URLs return 200
  └── .env.example                    # runtime env reference
.github/workflows/deploy.yml          # build → push → ssh deploy → certbot → 200 check
```

## CI/CD

On every push to `main` (or **Run workflow**), `.github/workflows/deploy.yml`:

1. Builds and pushes 4 images to Docker Hub
   (`<user>/ddb-website|ddb-server|ddb-admin|ddb-native`).
   The browser builds (`admin`, `native`) bake
   `…=https://server.didibhaiyakibiryani.com/graphql` at compile time.
2. Copies `docker-compose.yml` + `deploy/` to `/opt/ddb` on the host.
3. Over SSH: writes `/opt/ddb/.env` from secrets, `docker compose pull && up -d`,
   runs `setup-server.sh` (nginx config + certbot SSL), then `healthcheck.sh`.
   The job **fails** if any of the four URLs is not `200`.

### Required GitHub Actions secrets

| Secret | Purpose |
| ------ | ------- |
| `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` | push/pull images |
| `SSH_HOST`, `SSH_USER`, `SSH_PORT`, `SSH_KEY` | deploy host (`root@148.135.136.107`, port `22`) |
| `MONGODB_URI` | server database |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | transactional email |
| `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINTS` | media |
| `JWT_SECRET` *(recommended)* | auth signing. If omitted, the host generates and persists one in `/opt/ddb/.jwt_secret`. |

`CORS_ORIGINS` is set automatically to the three web origins.

## First-time host prep

`setup-server.sh` installs everything it needs, so a bare Ubuntu host only needs:

1. DNS A-records for `@`, `www`, `server`, `admin`, `native` → `148.135.136.107` (done).
2. Ports `80` and `443` open.
3. The Actions secrets above configured.

Then push to `main`. To run the host steps manually:

```bash
ssh root@148.135.136.107
cd /opt/ddb
docker compose pull && docker compose up -d
bash deploy/setup-server.sh      # nginx + certbot
bash deploy/healthcheck.sh
```

## Local production build (optional)

```bash
# from the repo root, with a filled deploy/.env (DOCKERHUB_USERNAME etc.)
docker compose --env-file deploy/.env up -d --build
```

## Notes

- **MongoDB**: the server exits on a bad `MONGODB_URI` and the container will
  restart-loop, so `server.…` won't return 200 until the URI is valid.
- **Native** is the Expo app exported to static web (`expo export --platform web`,
  `web.output: "single"`), served as an SPA.
- SSL auto-renews via the certbot systemd timer; `setup-server.sh` is safe to
  re-run and only renews when near expiry.
