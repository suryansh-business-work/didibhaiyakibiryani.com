# Didi Bhaiya ki Biryani — Product Roadmap

A Zomato-grade, fully admin-managed food platform. This is the extensive plan for
everything requested: payments, maps/location, transactional + marketing email,
a delivery app, observability (Signoz), dynamic branding, checkout, and full test
coverage with local husky gates.

> Stack policy (this repo): keep the existing stack — **server** (Express + Apollo +
> Mongoose, TS), **admin** (React + Vite + Apollo), **mobile/native** (Expo + Tamagui),
> **website** (Astro). New web portals (delivery) follow the admin stack. No MUI/Formik
> re-platform.

---

## 1. Services, ports & domains (target end state)

| # | Project | Port | Domain | Stack |
|---|---------|------|--------|-------|
| 1 | Website | 3000 | https://didibhaiyakibiryani.com | Astro (static + client fetch) |
| 2 | Server (GraphQL) | 3001 | https://server.didibhaiyakibiryani.com | Express + Apollo + Mongoose |
| 3 | Admin | 3002 | https://admin.didibhaiyakibiryani.com | React + Vite + Apollo |
| 4 | Native (customer) | 3003 | https://native.didibhaiyakibiryani.com | Expo web |
| 5 | **Delivery** (rider) | 3004 | https://delivery.didibhaiyakibiryani.com | React + Vite + Apollo |
| 6 | **Signoz** (observability) | 3005 | https://signoz.didibhaiyakibiryani.com | Signoz self-host (OTel) |

Each container listens on its own port (1:1), behind the host nginx (single
`sites-available/didibhaiyakibiryani.com`) with certbot SSL. Adding 5 & 6 requires:
nginx server blocks, certbot `-d`, compose services, and DNS A-records (delivery,
signoz → 148.135.136.107).

---

## 2. Environment variables (what to set, and where)

**Server (`server/.env` / Actions secrets)**
- `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGINS`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (added ✅), `MAIL_FROM`, `MAIL_FROM_NAME`
- **Razorpay**: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- **Google Maps (server)**: `GOOGLE_MAPS_API_KEY` (geocoding / distance matrix)
- **WhatsApp**: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` (Meta Cloud API) or `TWILIO_*`
- **Signoz / OTel**: `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, `OTEL_RESOURCE_ATTRIBUTES`

**Client builds (public, baked at build / passed as build-arg)**
- Website: `PUBLIC_API_URL`, `PUBLIC_ORDER_URL`, `PUBLIC_RAZORPAY_KEY_ID`, `PUBLIC_GOOGLE_MAPS_API_KEY`
- Native: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_RAZORPAY_KEY_ID`, `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- Admin: `VITE_API_URL`, `VITE_GOOGLE_MAPS_API_KEY`
- Delivery: `VITE_API_URL`, `VITE_GOOGLE_MAPS_API_KEY`

> Razorpay `KEY_ID` is public (used by the browser checkout); `KEY_SECRET` and
> `WEBHOOK_SECRET` are server-only. Restrict the **public** Maps key by HTTP referrer;
> keep the server Maps key unrestricted/IP-restricted.

---

## 3. Architecture decisions

- **Payments**: server creates a Razorpay order → client opens Razorpay Checkout →
  server verifies `razorpay_signature` (HMAC) → records `Payment` → updates `Order`.
  Webhook (`/webhooks/razorpay`) is the source of truth for paid/refunded. Refunds via
  Razorpay Refunds API from admin. Never trust client amounts (recompute server-side).
- **Maps/Location**: Places Autocomplete for address entry; reverse-geocode device GPS;
  store `{lat,lng,formatted,components}` on addresses; Maps JS API to render. Delivery
  live tracking: rider app posts GPS every ~10s → `DeliveryLocation` → admin/customer
  map via GraphQL **subscription** (graphql-ws) or short polling.
- **Email**: MJML templates compiled to HTML at build, rendered with a small data layer,
  sent via nodemailer (SMTP). Invoice PDF via a renderer (e.g. pdfkit) attached to the
  order email. Marketing campaigns = batched sends with unsubscribe + audience filters.
- **Branding**: a single `Settings` document (logo, primaryColor, companyName, address,
  phone, supportEmail, social, etc.). All apps fetch `settings` and apply via CSS
  variables / theme tokens at runtime → fully dynamic, admin-editable.
- **Observability**: Signoz self-hosted (ClickHouse + collector + query + UI) via its own
  compose; every service ships OTel traces + logs + metrics to the collector. Structured
  logging with `pino` → OTel logs. Frontends use OpenTelemetry web SDK for RUM.
- **Delivery app**: web portal (admin stack) — rider auth, assigned orders queue,
  accept/pickup/deliver, live GPS sharing, earnings. Role `DELIVERY` already in schema.
- **Checkout (Zomato-like)**: cart → address (map pick) → coupon → payment (COD/Razorpay)
  → place → live tracking. Shared logic in native + website.

---

## 4. Data model additions (server)

- `Payment` (orderId, provider, providerOrderId, providerPaymentId, amount, status,
  method, refunds[], logs[])
- `DeliveryAssignment` (orderId, riderId, status, acceptedAt, pickedUpAt, deliveredAt)
- `DeliveryLocation` (riderId, lat, lng, heading, at) — latest + history
- `Settings` (branding + company + flags) — singleton
- `Otp` (identifier, codeHash, purpose, expiresAt, attempts)
- `Campaign` (channel: EMAIL|WHATSAPP, audience, template, status, stats)
- `Address` extended with `lat/lng/formatted/placeId`
- `User` extended for rider profile (vehicle, isOnline, currentLocation)

---

## 5. Phased delivery plan

Each phase ends **green**: typecheck + lint + unit + e2e pass locally (husky), then push.

### Phase 0 — Foundations (tooling + infra scaffolding)
- Vitest (server + clients) + Playwright (e2e) + coverage.
- Husky: `pre-commit` = lint-staged + typecheck + affected unit tests; `pre-push` = e2e smoke.
- `pino` structured logging + OTel SDK wired (no Signoz yet, console exporter).
- Port/nginx/compose/DNS scaffolding for **delivery (3004)** and **signoz (3005)**.
- `__tests__/{unit,e2e}` structure per app.

### Phase 1 — Branding & Settings (dynamic everything)
- `Settings` model + admin "Branding" section (logo upload via ImageKit, primary color,
  company name, address, phone, support email/phone, socials).
- All apps consume `settings` → dynamic theme (CSS vars), logo, footer/contact.
- Tests: settings CRUD (unit), admin branding form (e2e), theme apply (component).

### Phase 2 — Payments (Razorpay) + admin Payments
- Server: create-order, verify-signature, webhook, refund; `Payment` logs.
- Website + native checkout: Razorpay Checkout, COD fallback.
- Admin "Payments": list, logs, refund, reconciliation.
- Tests: signature verify (unit), webhook idempotency (unit), checkout happy/refund (e2e).

### Phase 3 — Transactional + Marketing Email (MJML)
- MJML templates: OTP, Signup Success, Recent Login, Order Confirmation (+ invoice PDF),
  Order Delivered, Forgot/Reset Password, Marketing.
- Event wiring: register/login/order lifecycle/password reset → email.
- Admin "Email & WhatsApp Campaign": compose, audience, send, stats.
- Tests: template render snapshots, send (mock SMTP) unit, campaign e2e.

### Phase 4 — Maps & Location
- Address capture with Places Autocomplete + map pin (website header "Address",
  native + admin). Reverse geocode GPS. Store lat/lng.
- Delivery-fee/ETA by distance (Distance Matrix).
- Tests: address validation (unit, zod), map component (e2e), geocode (mock unit).

### Phase 5 — Delivery app (rider portal, 3004)
- Auth (DELIVERY), assigned-orders queue, accept/pickup/deliver, live GPS sharing,
  earnings. Admin "Manage Delivery": assign rider, see live riders on Google Map.
- Customer live tracking on the order page (rider marker moving).
- Tests: assignment flow (unit), live location (unit), rider e2e, tracking e2e.

### Phase 6 — Checkout polish + Orders/Delivery admin
- Zomato-grade checkout (cart edit, coupon, address, payment, place, track).
- Admin "Manage Orders" enhancements + "Manage Delivery" board.
- Tests: full order lifecycle e2e (place → pay → assign → deliver → email).

### Phase 7 — Observability (Signoz)
- Deploy Signoz stack (3005); point all services' OTel exporters to its collector.
- Traces (GraphQL resolvers, payments, email, maps), logs, RUM, dashboards + alerts.
- Tests: smoke that spans/logs reach the collector.

### Phase 8 — Hardening
- Accessibility, performance, SEO, rate-limiting, security headers, load test,
  full e2e regression, runbook docs.

---

## 6. Testing & quality gates

- **Unit**: Vitest — server resolvers/utils (pricing, coupon, signature, otp), client hooks/components.
- **E2E**: Playwright — auth, browse, checkout+pay, track, admin CRUD, rider flow.
- **Husky**: pre-commit (lint-staged + tsc + unit on changed), pre-push (e2e smoke).
  Local-first: fix until green locally, only then push. CI re-runs the full suite.
- All tests under `__tests__/{unit,e2e}` per app.

---

## 7. Sequencing & risk

- Phase 0 is mandatory first (gates everything).
- Payments (2) and Maps/Delivery (4–5) are the highest-value, highest-risk; they need
  real keys + sandbox testing.
- Signoz (7) is heavy infra (ClickHouse) — size the VPS before deploying.
- Each phase ships independently behind the existing green CI/CD.
