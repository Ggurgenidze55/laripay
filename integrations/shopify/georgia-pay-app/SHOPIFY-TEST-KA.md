# Shopify — სატესტო გადახდა (LariPay)

საბაზო URL: **https://laripay.vercel.app** (დომენი არ არის საჭირო).

## როგორ მუშაობს (მოკლედ)

1. მყიდველი checkout-ზე ირჩევს **Georgia Pay (TBC & BOG)**.
2. Shopify → `POST /api/payment_session` → პასუხი `{ "redirect_url": "..." }` (ბანკი).
3. მყიდველი იხდის TBC/BOG sandbox-ზე.
4. დაბრუნება → `GET /api/return?paymentId=...` → LariPay ამოწმებს სტატუსს → Shopify `paymentSessionResolve` → შეკვეთის დადასტურება.
5. Refund → Shopify → `POST /api/refund_session` → ბანკი → `refundSessionResolve`.

## წინაპირობები

- Shopify Partners → Development store (ვალუტა **GEL**).
- Vercel env: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `HOST` + `NEXT_PUBLIC_HOST` = `https://laripay.vercel.app`.
- **TBC ან BOG sandbox** — dashboard → ბანკები (მაღაზია იქმნება აპის ინსტალაციისას `shop@<slug>.laripay.ai` slug-ით).

## ერთჯერადი setup

```bash
cd integrations/shopify/georgia-pay-app
npx shopify auth login
npm run shopify:link    # ან: SHOPIFY_CLIENT_ID=... bash scripts/link-shopify.sh
# .env: SHOPIFY_API_SECRET Partners-დან
npx shopify app deploy  # განაახლებს payment extension URL-ებს Vercel-ზე
```

Dev მაღაზიაზე დააყენე აპი → Settings → Payments → ჩართე **Georgia Pay**.

## ტესტ checkout

1. Dev store → პროდუქტი → Checkout.
2. გადახდის მეთოდი: Georgian bank (GEL).
3. უნდა გადაგიყვანოს ბანკზე; დაბრუნების შემდეგ — Shopify thank you.

## ტესტ refund

Admin → Orders → Paid order → Refund → Shopify იძახებს `/api/refund_session`.

## პრობლემები

| სიმპტომი | მიზეზი |
|----------|--------|
| 422 payment_session | ბანკი არ არის კონფიგურირებული მერჩანტისთვის |
| არ ჩანს გადახდის მეთოდი | Extension არ არის deploy / GEL არაა |
| return-ზე ჩერდება | ბანკის სტატუსი pending — webhook ან poll |

Logs: Vercel → Functions → `payment_session`, `return`, `webhooks/tbc` ან `webhooks/bog`.
