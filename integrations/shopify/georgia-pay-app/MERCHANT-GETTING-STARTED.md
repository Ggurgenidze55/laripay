# Merchant getting started (LariPay)

This guide is for store owners using the LariPay merchant dashboard (`/laripay/{locale}/dashboard`). You can complete most steps **without bank credentials**; add TBC/BOG when you receive sandbox or production keys.

## 1. Sign up and open the dashboard

1. Register at [laripay.ai](https://laripay.ai) (or your deployed host).
2. Sign in and open **Dashboard** from the top navigation.
3. On **Overview**, follow the **Launch checklist** — it tracks platform, API keys, webhooks, and banks.

## 2. Connect your store (Integrations tab)

1. Open **Integrations** and select your platform (Shopify, WooCommerce, CS-Cart, etc.).
2. Download the plugin ZIP if shown, or install the Shopify app from the link.
3. Save your **store URL / domain** in LariPay.
4. Create a **test API key** (`sk_test_…`) — copy it once; it is not shown again.
5. Paste **API URL** and the test key into your store’s payment plugin settings.

## 3. Webhooks

1. Open **Webhooks** (or add an endpoint under Integrations).
2. Register your store’s callback URL (WooCommerce often auto-registers on plugin save).
3. Verify events: `payment.succeeded`, `payment.failed`, `checkout.session.completed`.

## 4. Sandbox demo (no bank yet)

1. From the checklist, click **Run sandbox demo** (or go to `/laripay/{locale}/demo`).
2. Complete a **2.00 GEL** test checkout when `LARIPAY_DEMO_API_KEY` is configured on the server.

## 5. Banks & setup (when you have credentials)

1. Open **Banks & setup** in the dashboard.
2. Enter **TBC** and/or **BOG** sandbox credentials (client ID/secret or public/secret keys).
3. Set `TBC_ENV=sandbox` and `BOG_ENV=sandbox` on the server until you go live.
4. Create a **live API key** (`sk_live_…`) only after banks approve production.

## 6. Go live checklist

| Step | Dashboard | Production env (Vercel/Railway) |
|------|-----------|----------------------------------|
| PostgreSQL | — | `DATABASE_URL` |
| Public URL | — | `NEXT_PUBLIC_HOST`, `HOST` |
| Admin tools | — | `LARIPAY_ADMIN_SECRET` |
| No public demo dashboard | — | `LARIPAY_ALLOW_PUBLIC_DEMO_DASHBOARD=0` |
| Portal sessions | — | `LARIPAY_PORTAL_SECRET` (strong random) |
| Banks | Banks & setup tab | `TBC_*`, `BOG_*`, `DEFAULT_PAYMENT_PROVIDER` |

## 7. Revoke API keys

Under **Integrations → API credentials**, use **Revoke** on any key that was leaked or rotated. Create a new key and update your store plugin.

## Support

- API reference: `/laripay/{locale}/docs/api`
- Integration guides: `/laripay/{locale}/integrations`
- Health: `/api/health`
