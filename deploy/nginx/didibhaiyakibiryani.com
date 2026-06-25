# /etc/nginx/sites-available/didibhaiyakibiryani.com
# Single source of truth for all four domains. Certbot (--nginx) injects the
# `listen 443 ssl` blocks and the HTTP->HTTPS redirects into this same file.
#
#   didibhaiyakibiryani.com         -> 127.0.0.1:3000  (website)
#   server.didibhaiyakibiryani.com  -> 127.0.0.1:3001  (graphql api)
#   admin.didibhaiyakibiryani.com   -> 127.0.0.1:3002  (admin spa)
#   native.didibhaiyakibiryani.com  -> 127.0.0.1:3003  (expo web)

# ── Website ──────────────────────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name didibhaiyakibiryani.com;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_read_timeout 60s;
    }
}

# ── GraphQL API ──────────────────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name server.didibhaiyakibiryani.com;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_read_timeout 60s;
    }
}

# ── Admin SPA ────────────────────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name admin.didibhaiyakibiryani.com;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_read_timeout 60s;
    }
}

# ── Native (Expo web) ────────────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name native.didibhaiyakibiryani.com;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_read_timeout 60s;
    }
}

# ── Delivery (rider app) ─────────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name delivery.didibhaiyakibiryani.com;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3004;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_read_timeout 60s;
    }
}

# ── Survey SPA ───────────────────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name survey.didibhaiyakibiryani.com;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3006;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_read_timeout 60s;
    }
}

# ── Track SPA ────────────────────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name track.didibhaiyakibiryani.com;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3007;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_read_timeout 60s;
    }
}

# ── Signoz (observability UI) ────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name signoz.didibhaiyakibiryani.com;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_read_timeout 60s;
    }
}
