# LariPay on Railway

Deploy the Next.js app without Docker. Railway builds from Git and runs `npm start`.

## One-time setup (Railway dashboard)

1. **New Project → Deploy from GitHub** — select this repository (already connected if you registered via GitHub).
2. **Add PostgreSQL** — in the project, click **+ New → Database → PostgreSQL**.
3. **App service settings**
   - **Settings → Root Directory:** `integrations/shopify/georgia-pay-app`
   - **Settings → Deploy:** branch `main` (or your production branch)
4. **Variables** (app service → Variables):

   | Variable | Value |
   |----------|--------|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference from your Postgres service) |
   | `HOST` | `https://<your-app>.up.railway.app` (or custom domain) |
   | `NEXT_PUBLIC_HOST` | same as `HOST` |
   | `LARIPAY_ALLOW_SIGNUP` | `1` (if public registration is wanted) |
   | `LARIPAY_ADMIN_SECRET` | strong random secret |
   | `LARIPAY_REQUIRE_2FA` | `0` (2FA disabled until Resend/Twilio are configured) |

   Copy bank keys, Shopify keys, and OTP email/SMS vars from [`.env.example`](./.env.example) as needed.

5. **Generate domain** — Settings → Networking → Generate Domain, then set `HOST` / `NEXT_PUBLIC_HOST` to that URL and redeploy once.

## Auto-deploy

After GitHub is linked, **every push to the connected branch** triggers a new build and deploy. No manual upload and no Docker on your machine.

## Build / start (from `railway.toml`)

- **Build:** `npm run build:railway` — PostgreSQL Prisma schema, `prisma generate`, optional `migrate deploy`, `next build`
- **Start:** `npm start` → `next start`
- **Health:** `GET /api/health`

## Docker?

**Not required for Railway.** Railway uses Nixpacks and the commands above.

The files under [`deploy/`](../../deploy/) (`Dockerfile`, `docker-compose.yml`) are only for a self-hosted VPS stack (see repo root `LARIPAY-PHASE3.md`).

## Monorepo note

The full repo is cloned; shared bank modules resolve from `src/` at the repository root during build. Keep **Root Directory** set to `integrations/shopify/georgia-pay-app` so install/build run in the app folder.

## Troubleshooting

- **Security scan blocked old Next.js** — use Next.js ≥ 14.2.35 (already in `package.json`).
- **Build fails without DB** — `postinstall` uses a dummy URL for `prisma generate`; set real `DATABASE_URL` for migrations at build time.
- **502 after deploy** — check logs; confirm `HOST` matches the public Railway URL.
