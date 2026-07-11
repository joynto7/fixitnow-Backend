# FixItNow 🔧 — Backend API

A backend API for a home services marketplace. Customers browse services, book technicians, pay via **Stripe or SSLCommerz**, track bookings, and leave reviews. Technicians manage a profile, services, and availability. Admins moderate users and oversee bookings/categories.

## Tech stack

Node.js + Express + TypeScript · PostgreSQL + Prisma · JWT auth · Zod validation · Stripe & SSLCommerz · OpenAPI/Swagger

## Getting started

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL, JWT_SECRET, etc.
docker compose up -d          # optional: spins up a local Postgres matching .env.example
npm run prisma:migrate        # create tables
npm run seed                  # wipe + seed demo data
npm run dev                   # http://localhost:4000
```

- Health check: `GET /health`
- Interactive docs: `GET /api-docs` (Swagger UI)
- Postman: import [`postman/FixItNow.postman_collection.json`](postman/FixItNow.postman_collection.json) — a single ordered, self-chaining flow. Set the `baseUrl` variable and hit **Run** on the whole collection.
  - Folder `07` needs real Stripe/SSLCommerz keys on the server to pass.
  - Folder `10` demonstrates the full paid → completed → reviewed lifecycle using seed data, so it only passes once per fresh `npm run seed`.
  - Folder `12` is reference-only (gateway callbacks) — deselect it before running.

## Demo accounts (from `prisma/seed.ts`)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@fixitnow.com` (or your `ADMIN_EMAIL`) | `Admin123!` (or your `ADMIN_PASSWORD`) |
| Technician | `bob.tech@fixitnow.com` / `erin.tech@fixitnow.com` / `frank.tech@fixitnow.com` | `password123` |
| Customer | `carol@fixitnow.com` / `dave@fixitnow.com` / `emma@fixitnow.com` | `password123` |

Also seeds 5 categories, 6 services, and 7 bookings (one per status, including a paid-and-reviewed one) so every endpoint has real data right away.

## Auth & responses

Register or log in to get a JWT, then send `Authorization: Bearer <token>` on protected routes. `ADMIN` is seed-only — not self-registerable.

Every response is `{ success, message, data, meta? }` on success or `{ success: false, message, errorDetails }` on error (`errorDetails` is a `{field, message}` list for validation failures, `null` otherwise).

## Booking status flow

```
REQUESTED --accept--> ACCEPTED --pay--> PAID --start--> IN_PROGRESS --complete--> COMPLETED
REQUESTED --decline--> DECLINED
REQUESTED/ACCEPTED/PAID --cancel--> CANCELLED   (only before IN_PROGRESS)
```

## Scripts

`npm run dev` · `npm run build` · `npm start` · `npm run prisma:migrate` · `npm run prisma:deploy` · `npm run seed`

## Deployment

Standard long-running Express server (not serverless) — deploys cleanly to **Render**:
- Build: `npm install && npm run build`, Start: `npm start`
- Add the env vars from `.env.example`, pointing `DATABASE_URL` at a reachable Postgres (e.g. [Neon](https://neon.tech))
- Set `BASE_URL` to the deployed URL (used to build payment redirect/webhook links)
- Run `npm run prisma:deploy` + `npm run seed` against the production database once, after first deploy

## Known limitations

- Single currency per provider (Stripe in USD, SSLCommerz in BDT) — no per-service currency field yet.
- JWT access tokens only, no refresh flow.
- `sslcommerz-lts` pulls in a `form-data` version with an unpatched advisory (no fix available upstream); our usage only passes fixed field names through it, not user-controlled ones.
