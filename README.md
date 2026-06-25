# Didi Bhaiya ki Biryani — Restaurant Management Platform

A full, four-part platform for a 100% vegetarian, delivery-only biryani brand.
*Har bite, yaad rahe.*

```
didibhaiyakibiryani.com/
├── website/      Marketing site            — Astro (static)
├── server/       GraphQL API + database    — Node, Express, Apollo, MongoDB (Mongoose)
├── admin/        Restaurant management      — React + Vite + Apollo Client
└── mobile-app/   Customer ordering app      — Expo + React Native + Tamagui
```

All four share **one GraphQL API** (`server/`) and **one MongoDB Atlas** database.

---

## Architecture at a glance

```
                       ┌──────────────────────┐
   website (Astro) ───▶│                      │
   admin   (React) ───▶│   GraphQL API        │───▶  MongoDB Atlas
   mobile  (Expo)  ───▶│   server/ :3001      │
                       └──────────────────────┘
```

- **server** owns the data model (Users, Categories, MenuItems, Coupons, Orders,
  Reviews), authentication (JWT), business rules (coupon evaluation, delivery-fee
  logic, order-status state machine) and analytics aggregations.
- **admin** is the staff/management console: dashboard, orders + live status
  updates, menu & category CRUD, coupon management, customers.
- **mobile-app** is the customer app: browse menu, item detail, cart, checkout
  with coupons, order placement and live order tracking, offers, profile/auth.
- **website** is the public marketing site (home + offers) built earlier.

---

## Prerequisites

- **Node.js ≥ 18** (tested on 22)
- A **MongoDB Atlas** connection string (free tier is fine)
- For the mobile app: the **Expo Go** app on your phone, or an Android/iOS emulator

---

## 1. Configure the database (required first)

Open `server/.env` and paste your Atlas URI:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/ddb?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-string
```

(`server/.env.example` documents every variable.)

## 2. Install dependencies

Each app is self-contained (no workspace hoisting — friendlier to React Native).

```bash
# from the repo root
npm run install:all          # server + admin + mobile-app
npm --prefix website install # (only needed if website deps aren't present)
```

Or install individually: `npm --prefix server install`, etc.

## 3. Seed sample data

Creates an admin, a demo customer, categories, the menu, the 5 coupons from the
website, testimonials and a few sample orders for the dashboard:

```bash
npm run seed        # = npm --prefix server run seed
```

**Seeded logins**

| Role     | Email                              | Password   |
| -------- | ---------------------------------- | ---------- |
| Admin    | `admin@didibhaiyakibiryani.com`    | `Admin@123`|
| Customer | `ananya@example.com`               | `Test@123` |

## 4. Run

Open separate terminals (or use the root scripts):

```bash
npm run dev:server     # GraphQL at  http://localhost:3001/graphql
npm run dev:admin      # Admin at    http://localhost:3002
npm run dev:website    # Website at  http://localhost:3000
npm run dev:mobile     # Expo dev server (scan the QR; web at http://localhost:3003)
npm run dev:survey     # Survey at   http://localhost:3006
npm run dev:track      # Track at    http://localhost:3007
npm run all            # all dev servers at once (concurrently)
```

> **Mobile app on a physical device:** `localhost` won't reach your machine.
> Set `EXPO_PUBLIC_API_URL` in `mobile-app/.env` to your computer's LAN IP, e.g.
> `http://192.168.1.5:3001/graphql`, and make sure both are on the same Wi-Fi.

---

## Tech stack

| App         | Stack                                                                 |
| ----------- | --------------------------------------------------------------------- |
| `website`   | Astro 4, vanilla CSS, Google Fonts (Playfair Display / Mulish)        |
| `server`    | Node + Express, Apollo Server 4, GraphQL, Mongoose 8, JWT, bcrypt, TS |
| `admin`     | React 18, Vite 5, Apollo Client 3, React Router 6, TypeScript         |
| `mobile-app`| Expo SDK 52, React Native 0.76, Expo Router, Tamagui, Apollo Client   |

---

## GraphQL API (server)

`POST http://localhost:3001/graphql` · health check at `/health`.
Send `Authorization: Bearer <token>` for authenticated operations.

**Key queries:** `me`, `categories`, `menuItems`, `menuItem`, `coupons`,
`validateCoupon`, `myOrders`, `order`, `orders` (staff), `customers` (admin),
`dashboardStats` (admin), `reviews`.

**Key mutations:** `register`, `login`, `addAddress`, `placeOrder`,
`cancelOrder`, `updateOrderStatus` (staff), plus full CRUD for
`Category` / `MenuItem` / `Coupon` (admin).

### Business rules (single source of truth, server-side)

- **Delivery fee:** ₹39, **free over ₹399** (`server/src/utils/pricing.ts`).
- **Coupons:** `PERCENT` (with optional cap), `FLAT`, `FREE_DELIVERY`,
  `FREE_ITEM`; honours `minOrder`, `firstOrderOnly`, `appOnly`, usage limits and
  validity windows. Prices are always recomputed from the DB at checkout — client
  totals are never trusted.
- **Order status flow:** `PLACED → CONFIRMED → PREPARING → OUT_FOR_DELIVERY →
  DELIVERED`, with `CANCELLED` reachable before delivery. Transitions are
  validated; the admin and the mobile tracker both render this same flow.

---

## Notes & next steps

- **Imagery:** food/people photos across the website and app are tasteful
  CSS/SVG placeholders styled to the brand. Drop real assets into each app's
  `public/`/`assets` and swap them into the components.
- **Payments:** `paymentMethod` is modelled (`COD` / `ONLINE`) but online payment
  is a stub — wire a gateway (Razorpay/Stripe) in `placeOrder` when ready.
- **Roles:** the schema already supports `STAFF` and `DELIVERY` users — a future
  driver/kitchen app can reuse the same API and auth.
- **Security:** set a strong `JWT_SECRET` and restrict `CORS_ORIGINS` before
  deploying.

---

© 2026 Didi Bhaiya ki Biryani (D&B Foods). 100% Pure Veg Kitchen
