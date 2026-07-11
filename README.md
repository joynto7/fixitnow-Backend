# FixItNow 🔧 — Backend API

A backend API for a home services marketplace. Customers browse services, book
technicians, pay for accepted bookings via **Stripe or SSLCommerz**, track
booking status, and leave reviews. Technicians manage a profile, services, and
availability, and work bookings through to completion. Admins moderate users
and oversee bookings/categories.

## Tech stack

- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT authentication, bcrypt password hashing, Zod request validation
- Stripe **and** SSLCommerz payment integration (selectable per payment)
- OpenAPI 3.0 docs served via Swagger UI

## Project structure

```
src/
├── app.ts, server.ts        Express app wiring + entry point
├── config/                  env validation, Prisma client singleton
├── middlewares/              auth, role, validation, error handling, 404
├── utils/                    AppError, catchAsync, response helpers, JWT
├── modules/
│   ├── auth/                 register, login, me
│   ├── categories/            public browse + admin CRUD
│   ├── services/              public browse/filter + technician CRUD
│   ├── technicians/            public browse + self profile/availability
│   ├── bookings/               customer booking lifecycle + technician actions
│   ├── payments/               Stripe + SSLCommerz providers, create/confirm/webhooks
│   ├── reviews/                 review a completed booking
│   └── admin/                   user moderation, booking oversight
├── routes/index.ts            mounts every module router under /api
└── docs/openapi.yaml          full API spec (served at /api-docs)
prisma/
├── schema.prisma             data model
├── migrations/                versioned SQL migrations
└── seed.ts                    deterministic demo data + admin account
```

## Getting started

### 1. Prerequisites

- Node.js 20+
- A PostgreSQL database (local, Docker, or a free cloud instance like
  [Neon](https://neon.tech) or [Supabase](https://supabase.com) — a cloud DB
  is required for a live deployment on Vercel/Render anyway, since they can't
  reach a database on your laptop)

### 2. Install and configure

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL, JWT_SECRET, etc.
```

Environment variables (see `.env.example`):

| Variable | Purpose |
|---|---|
| `PORT`, `BASE_URL` | server port and its public base URL (used to build payment redirect/callback URLs) |
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | JWT signing secret and token lifetime |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | credentials the seed script gives the admin account |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | from your Stripe **test mode** dashboard |
| `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_IS_LIVE` | from a free [SSLCommerz sandbox](https://developer.sslcommerz.com) store |

### 3. Set up the database

No local Postgres yet? `docker compose up -d` starts one (matches the
`DATABASE_URL` in `.env.example`: `postgresql://fixitnow:fixitnow_dev_pw@localhost:5544/fixitnow`).

```bash
npm run prisma:migrate   # creates tables from prisma/schema.prisma
npm run seed              # wipes + seeds deterministic demo data (see below)
```

### 4. Run it

```bash
npm run dev        # http://localhost:4000, auto-reloads
```

- Health check: `GET /health`
- Interactive API docs: `GET /api-docs` (Swagger UI). The same file
  (`src/docs/openapi.yaml`) can also be imported directly into Postman via
  **File → Import**.
- Ready-made Postman collection: [`postman/FixItNow.postman_collection.json`](postman/FixItNow.postman_collection.json)
  — a single ordered, self-chaining flow (folders `01`-`11`), not just a flat
  endpoint list. Import it and hit **Run** (Collection Runner) on the whole
  collection: each request's test script feeds the tokens/ids the next one
  needs (auth tokens, category/service/booking ids) via collection variables,
  so nothing needs to be copied by hand. `baseUrl` is already set to the live
  deployment.
  - Folder `07` (payment session creation) only goes green with real
    Stripe/SSLCommerz keys configured on the server.
  - Folder `10` demonstrates the full paid → in-progress → completed →
    reviewed lifecycle using the seed data's pre-paid booking, so it only
    passes once per fresh `npm run seed` — it fails with a clear message
    telling you to reseed if run again against already-consumed data.
  - Folder `12` is reference-only (Stripe/SSLCommerz call these, not a
    client) — deselect it before running the collection.

## Demo accounts (from `prisma/seed.ts`)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@fixitnow.com` (or your `ADMIN_EMAIL`) | `Admin123!` (or your `ADMIN_PASSWORD`) |
| Technician | `bob.tech@fixitnow.com` | `password123` |
| Technician | `erin.tech@fixitnow.com` | `password123` |
| Technician | `frank.tech@fixitnow.com` | `password123` |
| Customer | `carol@fixitnow.com` | `password123` |
| Customer | `dave@fixitnow.com` | `password123` |
| Customer | `emma@fixitnow.com` | `password123` |

The seed also creates 5 categories, 6 services, availability slots, and 7
bookings — one in each `BookingStatus` (including a Stripe-paid and an
SSLCommerz-paid booking, and a completed + reviewed one) — so every read
endpoint has real data to return immediately.

## Auth

Register or log in to get a JWT, then send it as `Authorization: Bearer
<token>` on protected routes. Roles (`CUSTOMER`, `TECHNICIAN`, `ADMIN`) are
fixed at registration; `ADMIN` accounts are seed-only and cannot be
self-registered.

## Payments

`POST /api/payments/create` starts a session with either provider for a
booking the technician has already `ACCEPT`ed, and returns a redirect URL
(Stripe Checkout or the SSLCommerz gateway page). Once the gateway confirms
payment — via its webhook/IPN, or by calling `POST /api/payments/confirm`
with just the `bookingId` — the payment is marked `COMPLETED` and the booking
moves to `PAID`. See `src/docs/openapi.yaml` (tag `Payments`) for the full
callback/webhook route list.

Both providers need real **test/sandbox** credentials in `.env` to actually
complete a payment; without them, session creation still exercises the full
code path but fails at the provider's API with a clear error.

## Booking status flow

```
REQUESTED --technician accepts--> ACCEPTED --payment confirmed--> PAID
REQUESTED --technician declines-> DECLINED
ACCEPTED/PAID/REQUESTED --customer cancels--> CANCELLED   (only before IN_PROGRESS)
PAID --technician starts--> IN_PROGRESS --technician completes--> COMPLETED
```

## Error format

Every error response is `{ "success": false, "message": string, "errorDetails":
... }` — `errorDetails` is a list of `{ field, message }` for validation
failures, `null` otherwise. Every success response is `{ "success": true,
"message": string, "data": ..., "meta"?: { total, page, limit } }`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | run with auto-reload |
| `npm run build` | compile to `dist/` (also copies `docs/openapi.yaml`) |
| `npm start` | run the compiled build |
| `npm run prisma:migrate` | create/apply a dev migration |
| `npm run prisma:deploy` | apply migrations in production |
| `npm run seed` | wipe and re-seed demo data |

## Known limitations

- **Single currency per provider.** There's no per-service currency field, so
  `price`/`amount` are treated as provider-native: Stripe sessions are created
  in USD, SSLCommerz sessions in BDT (its sandbox only settles in BDT). Fine
  for a demo; a real deployment would need an explicit currency column and
  conversion.
- **JWT access tokens only**, no refresh tokens — out of scope per the
  assignment's endpoint list; tokens simply expire after `JWT_EXPIRES_IN` and
  the user logs in again.
- **`sslcommerz-lts`'s transitive `form-data` dependency** has a known,
  currently-unpatched CRLF-injection advisory (`npm audit`). It's a required
  integration with no maintained alternative; our own usage only ever passes
  fixed field *names* into it (values are user data, e.g. customer name/email/
  address), which is the part of `form-data` that's actually vulnerable, but
  worth a second look before processing real, non-sandbox payments with it.

## Deployment

The app is a standard long-running Express server (not serverless functions),
which keeps Stripe webhook raw-body verification and SSLCommerz's
form-encoded callbacks simple — so a persistent-process host like **Render**
is the most direct fit:

1. Push this repo to GitHub.
2. Create a new Render Web Service from it.
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Add all the environment variables from `.env.example` (pointing
     `DATABASE_URL` at a reachable Postgres instance, e.g. Neon/Supabase/Render
     Postgres).
3. After the first deploy, run `npm run prisma:deploy` and `npm run seed`
   against the production database (e.g. via Render's shell), or point
   `DATABASE_URL` at it temporarily from your machine.
4. Point Stripe's webhook and SSLCommerz's store URLs at the deployed
   `BASE_URL` (e.g. `https://your-app.onrender.com`).
