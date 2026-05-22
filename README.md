# LariPay.ai (Fintech Pay)

**LariPay.ai** — საქართველოს გადახდის პლატფორმა: **Georgian Payments SDK** (TBC Pay + BOG Pay, GEL) და hosted API (Stripe-style).

დომენი: [LariPay.ai](https://laripay.ai)

## Project layout

| Path | Purpose |
|------|---------|
| `src/georgian-payments.{js,cjs}` | Canonical SDK (ESM + CJS) |
| `src/providers/` | TBC + BOG bank adapters |
| `src/php/` | Optional PHP SDK (`composer install`) |
| `integrations/shopify/georgia-pay-app/` | **LariPay.ai** — Next.js app, REST API, Shopify plugin |
| `integrations/wordpress/georgia-pay/` | WooCommerce plugin |
| `examples/smoke-test.cjs` | SDK smoke test |
| `LARIPAY-API.md` | LariPay.ai REST API reference |
| `LARIPAY-INTEGRATIONS.md` | Shopify / WooCommerce / custom API |
| `LARIPAY-PHASE2.md` | Refunds, idempotency, onboarding |
| `LARIPAY-PHASE3.md` | Docker, PostgreSQL, cloud deploy |
| `START-KA.md` | Dev setup (Georgian) |

## Quick start (LariPay.ai)

```bash
cd integrations/shopify/georgia-pay-app
cp .env.example .env
npm install
npx prisma db push
cd ../..
npm start
```

Then open `/api/laripay/setup`, copy `demo_api_key` → `LARIPAY_DEMO_API_KEY` in `.env`.

- **UI:** `/laripay`, `/laripay/dashboard` (routes; brand **LariPay.ai**)
- **Demo checkout:** `/demo`
- **Webhook:** `POST /api/webhook` (unified TBC + BOG)

## SDK quick start

```javascript
const { GeorgianPayments } = require('./src/georgian-payments.cjs');

const payments = new GeorgianPayments({
  tbcClientId: process.env.TBC_CLIENT_ID,
  tbcSecret: process.env.TBC_CLIENT_SECRET,
  bogPublicKey: process.env.BOG_PUBLIC_KEY,
  bogSecretKey: process.env.BOG_SECRET_KEY,
});

const result = await payments.createPayment(49.99, 'GEL', 'order-123', 'https://shop.ge/return');
```

## API (`GeorgianPayments`)

| Method | Description |
|--------|-------------|
| `createPayment(amount, currency, orderId, returnUrl, options?)` | Start TBC / BOG payment |
| `checkStatus(paymentId, provider)` | Poll status |
| `refund(paymentId, amount, provider)` | Refund |
| `handleWebhook(provider, payload, signature)` | Verify webhook |

## npm scripts (repo root)

| Script | Action |
|--------|--------|
| `npm start` | Next.js + ngrok + URL sync |
| `npm run dev:laripay` | Dev server |
| `npm run sync:ngrok` | Update `.env` from ngrok |
| `npm run health` | HTTP health checks |
| `npm run test:phase1` | Phase 1 tests |
| `npm run test:phase2` | Phase 2 tests |
| `npm run test:docker` | Docker health |
| `npm run docker:up` | Production stack local |

## Test SDK

```bash
node examples/smoke-test.cjs
```

## License

MIT
