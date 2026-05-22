# LariPay.ai — Vercel deploy

## მზაობა

- **UI / Landing / API** — build გადის (`npm run build:vercel`)
- **Production DB** — საჭიროა **PostgreSQL** (არა SQLite). Vercel-ზე `file:./dev.db` არ იმუშავებს.

## Vercel პროექტის პარამეტრები

**აუცილებელი:** Vercel → Settings → General → **Root Directory** = `integrations/shopify/georgia-pay-app`

> ⚠️ repo root-ზე `vercel.json` არ უნდა იყოს — ის ტოვებს install-ს და build ჩავარდება.

| პარამეტრი | მნიშვნელობა |
|-----------|-------------|
| **Framework** | Next.js (auto) |
| **Build Command** | `npm run build:vercel` |
| **Node** | 20.x |

`DATABASE_URL` დაამატე **Production** და **Build** გარემოში (Neon/Supabase), რომ `prisma migrate deploy` build-ზე გაეშვას.

## Environment Variables (აუცილებელი)

```env
DATABASE_URL=postgresql://USER:PASS@HOST:5432/laripay?sslmode=require
HOST=https://your-app.vercel.app
NEXT_PUBLIC_HOST=https://your-app.vercel.app
LARIPAY_RETURN_URL=https://your-app.vercel.app/payment/return
LARIPAY_WEBHOOK_URL=https://your-app.vercel.app/api/webhook
LARIPAY_ADMIN_SECRET=...
LARIPAY_ALLOW_SIGNUP=0
LARIPAY_ALLOW_PUBLIC_DEMO_DASHBOARD=0
```

ბანკები (sandbox/production): `TBC_*`, `BOG_*`, `TBC_ENV`, `BOG_ENV`.

Shopify (თუ გჭირდება): `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `NEXT_PUBLIC_SHOPIFY_API_KEY`, `SCOPES`.

## PostgreSQL

1. [Vercel Postgres](https://vercel.com/storage/postgres), **Neon**, ან **Supabase** — შექმენი DB
2. `DATABASE_URL` ჩასვი Vercel Environment-ში
3. Build-ის დროს `prisma migrate deploy` გაეშვება (`build:vercel`)

## Deploy

```bash
# CLI-ით (repo root-დან)
cd integrations/shopify/georgia-pay-app
npx vercel
```

ან GitHub → Import `Ggurgenidze55/laripay` → Root Directory = `integrations/shopify/georgia-pay-app`.

## შენიშვნები

- **Docker** (`deploy/`) — სრული production stack (Postgres + long-running) უკეთესია მაღალი traffic-ისთვის
- **Vercel** — იდეალურია landing + API demo/staging; webhook-ები და bank callbacks მუშაობს სწორი `HOST`-ით
- `output: 'standalone'` Dockerfile-ისთვისაა; Vercel-ზე ჩვეულებრივ პრობლემა არ ქმნის

## URLs after deploy

- Landing: `https://your-app.vercel.app/laripay`
- Health: `https://your-app.vercel.app/api/health`
- Setup: `https://your-app.vercel.app/api/laripay/setup`
