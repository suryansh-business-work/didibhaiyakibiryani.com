#!/usr/bin/env bash
# Idempotent host bootstrap: installs nginx + certbot + docker (if missing),
# installs the single sites-available config, and obtains/renews SSL certs.
# Safe to run on every deploy.
set -euo pipefail

DOMAIN="didibhaiyakibiryani.com"
SUBDOMAINS=("www.${DOMAIN}" "server.${DOMAIN}" "admin.${DOMAIN}" "native.${DOMAIN}")
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() { echo -e "\n\033[1;33m▶ $*\033[0m"; }

# ── 1. Prerequisites ─────────────────────────────────────────────
if ! command -v nginx >/dev/null 2>&1 || ! command -v certbot >/dev/null 2>&1; then
  log "Installing nginx + certbot"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y nginx certbot python3-certbot-nginx curl
fi

if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker"
  curl -fsSL https://get.docker.com | sh
fi

if ! docker compose version >/dev/null 2>&1; then
  log "Installing docker compose plugin"
  apt-get install -y docker-compose-plugin || true
fi

# ── 2. Install the nginx site (single file, all domains) ─────────
log "Installing nginx site: ${DOMAIN}"
install -D -m 0644 "${HERE}/nginx/${DOMAIN}" "/etc/nginx/sites-available/${DOMAIN}"
ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
rm -f /etc/nginx/sites-enabled/default

log "Validating nginx config"
nginx -t
systemctl reload nginx

# ── 3. SSL via certbot (idempotent) ──────────────────────────────
log "Requesting/renewing certificates with certbot"
DOMAIN_ARGS=(-d "${DOMAIN}")
for d in "${SUBDOMAINS[@]}"; do DOMAIN_ARGS+=(-d "${d}"); done

certbot --nginx "${DOMAIN_ARGS[@]}" \
  --non-interactive --agree-tos -m "${CERTBOT_EMAIL}" \
  --redirect --keep-until-expiring --expand

systemctl reload nginx
log "Server setup complete."
