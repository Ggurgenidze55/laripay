# LariPay.ai + Georgia Pay (Shopify)

Next.js 14 app: **LariPay.ai** — payments, installments, delivery, warehouse sync, and **Shopify** offsite payments (Georgian banks, GEL).

## Stack

- Next.js 14 (App Router)
- Prisma + PostgreSQL
- SDKs: `@georgian-payments`, `@georgian-delivery`, `@georgian-warehouse` → `../../../src/*.cjs`
- Shopify Payments App API (optional)

## Setup

```bash
cp .env.example .env
npm install
npx prisma migrate deploy   # or db push locally
npm run dev
```

From repo root: `npm start` (Next + ngrok + env sync).

Configure bank/courier/warehouse credentials in `.env` or merchant dashboard.

## Platform API (high level)

| Area | Routes |
|------|--------|
| Payments | `POST /api/v1/checkout/sessions`, `/api/v1/banks` |
| Installments | `POST /api/v1/checkout/installment-sessions` |
| Delivery | `POST /api/v1/delivery/rates`, `/api/v1/delivery/shipments` |
| Warehouse | `POST /api/v1/warehouse/sync/stock`, `/sync/products`, `/sync/orders` |

See [LARIPAY-API.md](../../../LARIPAY-API.md), [LARIPAY-INTEGRATIONS.md](../../../LARIPAY-INTEGRATIONS.md).

## Shopify

| Route | Purpose |
|-------|---------|
| `POST /api/payment_session` | Card checkout redirect |
| `POST /api/payment_session_installment` | Installment checkout |
| `POST /api/refund_session` | Refund |
| `GET/PUT /api/settings` | Per-shop credentials |

```bash
npx shopify auth login
npm run shopify:dev
```

## Database

```bash
npx prisma studio
```

Canonical schema: `prisma/schema.prisma` (PostgreSQL). `schema.postgresql.prisma` is kept in sync for Docker/Vercel build scripts.
