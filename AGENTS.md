# LariPay / Fintech Pay — Agent Handbook

> **Purpose:** Give any new Cursor agent full project context from prior work (WooCommerce gateway, payment flow, deploy, user goals).  
> **Owner language:** User often writes in Georgian; product copy supports `ka` + `en`.  
> **Deep history:** Past chat transcript: `.cursor/projects/.../agent-transcripts/b9391293-4a97-443b-acd6-1e942f4ddbfa.jsonl`

---

## 1. Product vision

**LariPay.ai** = Georgian payment gateway SaaS (Stripe/Flitt-like) for the Georgia market.

- **Currency:** GEL only (`981`, symbol `₾`)
- **Banks:** TBC, BOG, Liberty, Credo, Cartu, Basis, Flitt (bank-hosted card checkout — LariPay never sees card numbers)
- **Billing:** 1% commission **or** monthly subscription per merchant
- **Production URL:** https://laripay.vercel.app
- **Brand:** LariPay.ai (rebranded from earlier Payka naming; legacy `payka_*` keys still supported in plugin/API)

### Current product focus (2026-05)

| Area | Status |
|------|--------|
| **WooCommerce plugin** | **Active** — primary merchant integration |
| **Direct API** (`/api/v1/*`) | **Active** |
| **Shopify Payments extension** | **Paused** — Shopify Payments Partner Platform is invitation-only; external redirect blocked in Additional Scripts |
| **Shopify manual payment flow** | Built but deprioritized |
| **Real TBC/BOG bank APIs** | Not fully wired in production; **test mode** simulates payments |

---

## 2. Repository layout

```
Fintech Pay/
├── src/                          # Shared Georgian payments SDK (TBC, BOG, webhooks)
├── integrations/
│   ├── shopify/georgia-pay-app/  # ★ Main Next.js 14 app (LariPay SaaS + API + dashboard)
│   └── wordpress/
│       ├── georgia-pay/          # ★ WooCommerce plugin (LariPay gateway)
│       ├── georgia-delivery/     # Shipping integration
│       ├── georgia-warehouse/    # Warehouse sync
│       └── test-plugin.php       # Static validation (94+ tests)
├── services/laripay-core/        # Separate core service (Prisma, enterprise checkout)
└── AGENTS.md                     # This file
```

### Main app path

`integrations/shopify/georgia-pay-app/`

- **Framework:** Next.js 14, App Router
- **DB:** PostgreSQL (Railway) via Prisma
- **Deploy:** Vercel (`npm run build:vercel` → `scripts/vercel-build.mjs`)
- **Integration ZIPs:** `integration-packages/georgia-pay.zip` (built on Vercel build)

---

## 3. WooCommerce plugin (v1.0.4)

**Path:** `integrations/wordpress/georgia-pay/`  
**Plugin name:** LariPay.ai — Georgia Pay  
**ZIP:** `integrations/shopify/georgia-pay-app/integration-packages/georgia-pay.zip`

### Gateways

1. `georgia_pay` — card payments  
2. `georgia_pay_installments` — installment payments  

### Merchant settings (WooCommerce → Payments)

- `laripay_api_url` — default `https://laripay.vercel.app`
- `laripay_secret_key` — `sk_test_...` / `sk_live_...`
- `laripay_webhook_secret` — optional `whsec_...`
- `bank` — **default bank** (customer can override at checkout)

### Features implemented in recent sessions

1. **LariPay API checkout** — creates session via `POST /api/v1/checkout/sessions`
2. **WooCommerce Blocks** checkout support (`class-georgia-pay-blocks-support.php`, `assets/js/blocks.js`)
3. **Webhooks** — `?wc-api=georgia_pay_laripay` handles `payment.succeeded` / `payment.failed`
4. **Instant payment outcome** — return URL adds `?laripay=success|failed`; `Georgia_Pay_Return_Handler` marks order **Completed** or **Failed** before thank-you page renders
5. **Bank selection at checkout** — radio grid in `payment_fields()` + Blocks; passed as `provider` to API
6. **Bank selection on LariPay test page** — `/payment/test?session=...`
7. **Georgian i18n** — `languages/georgia-pay-ka_GE.po`
8. **HPOS compatible**, auto GEL on activation

### Key plugin files

| File | Role |
|------|------|
| `georgia-pay.php` | Bootstrap, v1.0.4 |
| `includes/class-wc-georgia-pay-gateway.php` | Main gateway, bank picker, `process_payment` |
| `includes/class-georgia-pay-return-handler.php` | `laripay=` param, auto `completed` status |
| `includes/class-georgia-pay-laripay-webhook.php` | Inbound webhooks |
| `includes/class-georgia-pay-laripay-client.php` | REST client to LariPay API |
| `includes/class-georgia-pay-blocks-support.php` | Blocks checkout |
| `assets/css/checkout.css` | Checkout + result banners + bank grid |

### Plugin validation

```bash
php integrations/wordpress/test-plugin.php
# Expect: All tests passed
```

### Known plugin limitations

- **Local webhooks** (`woocommerce-test-pay.local`) won't receive Vercel callbacks from the internet — return URL + `laripay=` query param is critical for local testing
- Admin **bank** setting is default only; customer chooses at checkout

---

## 4. Payment flows

### Test mode (current default for dev)

1. Customer checks out → WooCommerce creates LariPay session with chosen `provider`
2. Redirect to `https://laripay.vercel.app/payment/test?session={id}`
3. Customer **chooses bank** (if not already chosen at checkout) → `POST /api/payment/set-bank`
4. **Pay Now** → `POST /api/payment/test-complete` `{ action: 'approve' }`
5. Redirect to WooCommerce thank-you with `?laripay=success`
6. Plugin runs `payment_complete()` → order status **Completed** (not Processing)
7. **Cancel** → `?laripay=failed` → order **Failed**

### Production (when bank APIs configured)

1. Same session creation with `provider`
2. Redirect to real bank-hosted page
3. Bank callback → LariPay webhook/finalize → merchant webhook + return URL with `laripay=success|failed`
4. WooCommerce updates order automatically

### Redirect result helper

`lib/laripay/redirect-result.ts` — `appendLariPayResult(url, 'success'|'failed')`

Used in: `lib/laripay/finalize.ts`, `app/api/payment/test-complete/route.ts`, `app/payment/return/route.ts`

### Important API routes (payment)

| Route | Purpose |
|-------|---------|
| `POST /api/v1/checkout/sessions` | Create checkout session (accepts `provider`) |
| `GET /api/v1/checkout/sessions/:id` | Poll session status |
| `GET /api/payment/test-session?id=` | Test page session + bank list |
| `POST /api/payment/set-bank` | Update session provider before pay |
| `POST /api/payment/test-complete` | Simulate approve/decline in test mode |
| `GET /payment/return?paymentId=` | Bank return → finalize → redirect to merchant |

---

## 5. LariPay API / lib structure

**Auth:** Bearer `sk_test_...` / `sk_live_...`  
**Integration header:** `X-LariPay-Integration: woocommerce`

| Path | Module |
|------|--------|
| `lib/laripay/checkout.ts` | Session create, bank init, `updateCheckoutSessionProvider` |
| `lib/laripay/finalize.ts` | Post-bank finalize + webhooks + redirect with `laripay=` |
| `lib/laripay/merchant-config.ts` | Per-merchant bank creds; `isBankConfigured` returns true in test mode |
| `lib/laripay/webhooks-outbound.ts` | Dispatch to merchant webhook URLs |
| `lib/georgian-banks/registry.ts` | Bank IDs and labels (en/ka) |
| `lib/laripay/merchant-integration-catalog.ts` | Dashboard integrations — **Shopify removed**, WooCommerce + API only |

---

## 6. Deployment

### Vercel (production)

```bash
cd integrations/shopify/georgia-pay-app
npx vercel --prod --yes
```

- **Alias:** https://laripay.vercel.app
- Build runs Prisma migrate + rebuilds `integration-packages/*.zip`
- Health: `GET /api/health`

### Local WordPress testing

- Site: `woocommerce-test-pay.local` (Local by Flywheel)
- Currency: **GEL**
- Plugin: upload `georgia-pay.zip` v1.0.4
- LariPay API URL: `https://laripay.vercel.app`
- Secret key from LariPay dashboard (`/api/laripay/setup` or merchant dashboard)

### ngrok (optional local API)

Used earlier for Shopify dev; env vars `LARIPAY_RETURN_URL`, `LARIPAY_WEBHOOK_URL`. WooCommerce local testing relies more on return URL than webhooks.

---

## 7. User goals (do not regress)

1. **Simple merchant setup** — minimal friction, auto defaults on plugin activation
2. **No manual order status updates** — payment confirmation must auto-set Completed/Failed
3. **Instant customer feedback** — no vague "payment is being processed" when outcome is known
4. **Customer chooses bank** — at checkout and/or LariPay payment page
5. **No email payment links** as primary product approach (user rejected this)
6. **Georgian market** — GEL, local banks, Georgian UI where applicable

---

## 8. Agent do / don't

### Do

- Keep WooCommerce plugin and API changes in sync (provider, return flags, webhooks)
- Run `php integrations/wordpress/test-plugin.php` after plugin changes
- Run `npx tsc --noEmit` in `georgia-pay-app` after TS changes
- Rebuild ZIP: `node scripts/build-integration-packages.mjs`
- Match existing naming (`laripay_*`, legacy `payka_*` fallbacks)
- Use `appendLariPayResult` on all merchant redirect URLs after payment
- Set WooCommerce post-payment status to **`completed`** for LariPay gateways (via `Georgia_Pay_Return_Handler`)

### Don't

- Don't commit secrets (`.env`, API keys pasted in chat — recommend rotation)
- Don't force-push `main` without explicit user request
- Don't commit unless user asks
- Don't re-prioritize Shopify Payments extension without user direction
- Don't use `private $settings` in Blocks support — must be **`protected`** (WooCommerce parent requirement)
- Don't require `class-georgia-pay-blocks-support.php` before Blocks class exists — load inside `georgia_pay_blocks_support()` hook

---

## 9. Fatal errors fixed (historical — avoid reintroducing)

1. **Blocks support loaded too early** → require inside `woocommerce_blocks_loaded`
2. **`private $settings`** in Blocks class → changed to **`protected $settings`**
3. **Order stuck on Processing** → filter `woocommerce_payment_complete_order_status` → `completed`
4. **Thank-you "processing…" message** → process `?laripay=` on `template_redirect` before render

---

## 10. Version & deploy snapshot (last session)

| Component | Version / URL |
|-----------|----------------|
| WooCommerce plugin | **1.0.4** |
| Production | https://laripay.vercel.app (deployed via Vercel CLI) |
| Last deployment id | `dpl_E7CrLMBvSzQCznWYMz2CVv8V9HZx` |

### Likely uncommitted local changes

Payment flow, bank selection, return handler, and plugin v1.0.4 may exist locally without a git commit. Check `git status` before assuming remote git matches production Vercel deploy (Vercel CLI deploys local files).

---

## 11. Quick test checklist

- [ ] Plugin v1.0.4 active, GEL currency, API URL + secret configured
- [ ] Checkout shows bank radio grid under LariPay method
- [ ] Place order → LariPay test page → choose bank → Pay Now
- [ ] Thank-you: green success banner, order **Completed**
- [ ] Cancel flow: red failure banner, order **Failed**
- [ ] `php integrations/wordpress/test-plugin.php` passes

---

## 12. Related packages (lower priority)

- `georgia-delivery` — LariPay shipping rates
- `georgia-warehouse` — inventory sync
- `laripay-opencart`, `laripay-prestashop`, `laripay-cscart` — scaffold integrations

---

*Last updated from agent session covering: instant payment status, bank selection, Vercel production deploy, WooCommerce plugin v1.0.4.*
