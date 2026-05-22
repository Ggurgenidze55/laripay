# LariPay.ai — ფაზა 2

ფაზა 2 აფართოებს პლატფორმას: refunds, idempotency, მერჩანტის onboarding, webhooks API, live keys.

## ახალი API

| Method | Path | აღწერა |
|--------|------|--------|
| POST | `/api/v1/refunds` | დაბრუნება (`payment_id`, optional `amount`) |
| GET | `/api/v1/refunds/:id` | Refund სტატუსი |
| GET | `/api/v1/payments` | გადახდების სია (`?limit=20&status=succeeded`) |
| GET/POST | `/api/v1/webhooks` | მერჩანტის webhook endpoints |
| POST | `/api/laripay/signup` | პუბლიკური რეგისტრაცია (`LARIPAY_ALLOW_SIGNUP=1`) |
| POST | `/api/laripay/merchants/:id/api-keys` | `sk_live_` / `sk_test_` (admin) |

### Idempotency

```http
POST /api/v1/checkout/sessions
Idempotency-Key: order-123-v1
```

იგივე key → იგივე session (200), ახალი გადახდა არ იქმნება.

```http
POST /api/v1/refunds
Idempotency-Key: refund-order-123
```

### Refund

```http
POST /api/v1/refunds
Authorization: Bearer sk_test_...

{
  "payment_id": "clxxx...",
  "amount": 10.5,
  "reason": "customer request"
}
```

## UI

| გვერდი | აღწერა |
|--------|--------|
| `/laripay/onboard` | მერჩანტის self-service signup |
| `/laripay/dashboard` | სტატისტიკა + ბოლო გადახდები |

## .env (ფაზა 2)

```env
LARIPAY_ALLOW_SIGNUP=1
# Production DB (optional):
# DATABASE_URL=postgresql://user:pass@localhost:5432/laripay
```

## WooCommerce

პარამეტრების შენახვისას პლაგინი ავტომატურად იძახებს `POST /api/v1/webhooks` LariPay.ai-ზე.

## Live keys (admin)

```http
POST /api/laripay/merchants/{merchantId}/api-keys
X-LariPay-Admin-Secret: ...

{ "mode": "live", "name": "Production" }
```

## ფაზა 3 (შემდეგი)

- PostgreSQL production + Docker
- KYC / onboarding portal
- Settlement & payouts
- მეტი acquirer
