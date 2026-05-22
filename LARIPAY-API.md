# LariPay.ai API — საქართველოს გადახდის პლატფორმა

**LariPay.ai** (დომენი: laripay.ai) — Stripe-ის მსგავსი REST API TBC Pay + BOG Pay-ზე (GEL).

**პლაგინები და ინტეგრაციები:** იხილე [LARIPAY-INTEGRATIONS.md](./LARIPAY-INTEGRATIONS.md) (Shopify, WooCommerce, custom).

## ბილინგი

| რეჟიმი | აღწერა |
|--------|--------|
| `COMMISSION` (default) | **1%** თითო წარმატებულ გადახდაზე (`commission_rate_bps: 100`) |
| `SUBSCRIPTION` | ყოველთვიური გეგმა — **0%** საკომისიო აქტიური პერიოდში |

გეგმები: `starter` (49 ₾/თვე), `pro` (149 ₾/თვე).

## სწრაფი სტარტი

```bash
cd integrations/shopify/georgia-pay-app
npm install
npm run db:push
npm run dev
```

1. გახსენი `http://localhost:3000/api/laripay/setup` — დააკოპირე `demo_api_key` → `.env` როგორც `LARIPAY_DEMO_API_KEY`
2. დაამატე `LARIPAY_ADMIN_SECRET=...` (მერჩანტების შექმნისთვის)
3. TBC/BOG sandbox keys `.env`-ში

## Checkout (მერჩანტის API)

```http
POST /api/v1/checkout/sessions
Authorization: Bearer sk_test_...
Content-Type: application/json

{
  "amount": 25.50,
  "currency": "GEL",
  "provider": "tbc",
  "success_url": "https://shop.ge/order/ok",
  "cancel_url": "https://shop.ge/order/cancel",
  "client_reference_id": "order-123"
}
```

პასუხი: `url` (ბანკზე გადამისამართება), `platform_fee`, `net_amount`, `fee_mode`.

## სხვა endpoints

| Method | Path | აღწერა |
|--------|------|--------|
| GET | `/api/v1/checkout/sessions/:id` | სესიის სტატუსი |
| GET | `/api/v1/payments/:id` | გადახდა + საკომისიო |
| GET | `/api/v1/balance` | მოცულობა და საკომისიოების ანგარიში |

## Admin (შენ — პლატფორმის მფლობელი)

```http
POST /api/laripay/merchants
X-LariPay-Admin-Secret: <LARIPAY_ADMIN_SECRET>

{ "name": "My Shop", "email": "shop@example.com", "billing_mode": "COMMISSION" }
```

გამოწერა:

```http
PATCH /api/laripay/merchants/:id/billing
{ "billing_mode": "SUBSCRIPTION", "subscription_plan": "starter", "subscription_months": 1 }
```

## Merchant webhooks

```http
POST /api/laripay/merchants/:id/webhooks
{ "url": "https://shop.ge/webhooks/laripay", "events": ["payment.succeeded", "payment.failed"] }
```

Headers: `LariPay-Signature`, `LariPay-Timestamp`, `LariPay-Event` (legacy: `Payka-*`).

## UI

- `/laripay` — ლენდინგი
- `/laripay/dashboard` — სტატისტიკა და ბილინგი
- `/demo` — პირდაპირი TBC/BOG ტესტი

## Shopify / WooCommerce

კანალებია LariPay.ai API-ს გარშემო — იგივე ბანკური ადაპტერები, მაგრამ მერჩანტებისთვის ძირითადი პროდუქტი არის **REST API + dashboard**.
