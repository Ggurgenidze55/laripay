# LariPay — შემდეგი ნაბიჯები

## Shopify — Manual Payment ინტეგრაცია (აქტიური)

Payments Partner Platform invitation-only-ა, ამიტომ Manual Payment flow:

1. მერჩანტი ამატებს manual payment: "LariPay (Georgian Bank)"
2. მყიდველი ირჩევს checkout-ზე → შეკვეთა pending
3. LariPay `orders/create` webhook → ავტომატურად ქმნის გადახდის session
4. მყიდველი იხდის ბანკზე (TBC/BOG)
5. გადახდის შემდეგ Shopify order → **paid** (Admin API)

### ფაილები
- `lib/shopify-admin.ts` — Shopify Admin GraphQL API (markAsPaid, webhooks, orders)
- `lib/laripay/shopify-manual-payment.ts` — Manual payment ლოგიკა
- `app/api/shopify/webhooks/route.ts` — Webhook endpoint + HMAC verification
- `lib/laripay/finalize.ts` — გადახდის შემდეგ Shopify order paid

### Setup (მერჩანტისთვის)
- [ ] App re-install (ახალი scopes: `read_orders,write_orders`)
- [ ] Shopify Admin → Settings → Payments → Manual → "LariPay (Georgian Bank)"
- [ ] ტესტ checkout

## Shopify — Payments Extension (მომავალი)

> Shopify Support (2026-05-25): invitation-only
- [ ] Shopify-მა თუ გახსნა → `npx shopify app deploy --allow-updates`

## რაზე შეგვიძლია ვიმუშაოთ ახლავე

### 1. ბანკის sandbox ტესტი
- TBC/BOG sandbox credentials ჩასვა `.env`-ში
- Checkout session შექმნა (curl ან dashboard)
- გადახდის ფლოუ ტესტი: redirect → ბანკი → return

### 2. WooCommerce ტესტი
- ლოკალური WordPress-ზე პლაგინის დაყენება
- Georgia Pay gateway ჩართვა
- Checkout + webhook ტესტი

### 3. Dashboard-ის დახვეწა
- UI გაუმჯობესება
- ახალი ფუნქციები / ანალიტიკა
- მობილურ ვერსიაზე ადაპტაცია

### 4. API დოკუმენტაცია
- Docs გვერდის გაუმჯობესება
- Postman / OpenAPI collection
- კოდის მაგალითები (cURL, JS, PHP)

### 5. მერჩანტ onboarding
- რეგისტრაციის ფლოუ დახვეწა
- 2FA (Resend email / Twilio SMS)
- Email verification

### 6. Production მომზადება
- დომენი (laripay.ai)
- SSL / monitoring / error tracking
- Sentry ან LogRocket ინტეგრაცია

## პროექტის მდგომარეობა (2026-05-25)

| მიმართულება | სტატუსი |
|-----------|--------|
| მერჩანტ Dashboard | ✅ სრული |
| ბანკები (TBC + BOG + 5 beta) | ✅ სრული |
| WooCommerce პლაგინი | ✅ სრული |
| API v1 (~62 route) | ✅ სრული |
| კონფიგურაცია / .env | ✅ სრული |
| Shopify Extension | ⏳ Beta access ელოდება |
