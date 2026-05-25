# Shopify — სატესტო გადახდა (LariPay)

საბაზო URL: **https://laripay.vercel.app** (დომენი არ არის საჭირო).

## შეცდომა: `No app with client ID YOUR_CLIENT_ID found`

`shopify.app.toml`-ში ჯერ არ არის ნამდვილი აპი. **ჯერ ეს გააკეთე**, მერე `deploy` / `dev`:

```bash
cd integrations/shopify/georgia-pay-app
npx shopify auth login
npx shopify app config link --reset
```

CLI გკითხავს: Organization → **Create new app** (ან აირჩიე არსებული Georgia Pay).  
შემდეგ `shopify.app.toml`-ში `client_id` ავტომატურად შეიცვლება (არა `YOUR_CLIENT_ID`).

`.env`-ში დაამატე (Partners → App → Client credentials):

```env
SHOPIFY_API_KEY=<იგივე რაც client_id toml-ში>
SHOPIFY_API_SECRET=<shpss_...>
NEXT_PUBLIC_SHOPIFY_API_KEY=<იგივე client id>
```

იგივე `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` ჩასვი **Vercel** Environment-ში და გადააკეთე deploy.

შემდეგ:

```bash
npx shopify app deploy
npx shopify app dev --store=testpaynment.myshopify.com
```

(შენი მაღაზია: `testpaynment.myshopify.com` — admin URL-ში შეამოწმე სწორი სპელი.)

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
npx shopify app deploy --allow-updates  # განაახლებს payment extension URL-ებს Vercel-ზე
```

Dev მაღაზიაზე დააყენე აპი → Settings → Payments → ჩართე **Georgia Pay**.

## ტესტ checkout

1. Dev store → პროდუქტი → Checkout.
2. გადახდის მეთოდი: Georgian bank (GEL).
3. უნდა გადაგიყვანოს ბანკზე; დაბრუნების შემდეგ — Shopify thank you.

## ტესტ refund

Admin → Orders → Paid order → Refund → Shopify იძახებს `/api/refund_session`.

## Deploy შეცდომები

### `Multiple payments extensions are not supported`

Shopify-ზე **ერთ აპზე მხოლოდ ერთი** `payments_extension` შეიძლება. პირველი ტესტისთვის დარჩა მხოლოდ `georgia-pay-offsite`. Installments extension არქივშია: `archived-extensions/georgia-pay-installments-offsite/` (მოგვიანებით ცალკე აპით ან როცა Shopify მისცემს მეორეს).

### `api_version` must be one of … `2024-07`

Extension-ში და `shopify.app.larypay.toml` webhooks-ში გამოიყენე **`2024-07`** (არა `2024-10`).

### `Beta requirements not met` (ყველაზე ხშირი — ანგარიშის უფლება)

Shopify **Payments Platform** ახლა **მოწვევით**ა: ჩვეულებრივი Dev Dashboard აპი (`config link` → LariPay) **არ არის** Payments Partner აპი, ამიტომ `deploy` ბლოკავს extension-ს.

**რა გააკეთო:**

1. [Become a Payments Partner](https://shopify.dev/docs/apps/build/payments/payments-extension-review#payments-partner-application-review) — განაცხადი / მოწვევა Shopify-ისგან.
2. Partners → **Support** → მიუთითე: offsite payments extension საქართველოსთვის (GEL), test mode, `laripay.vercel.app`.
3. დამტკიცების შემდეგ იგივე `npx shopify app deploy --allow-updates` — მაშინ **Georgia Pay** გამოჩნდება Payments-ში.

სანამ არ დამტკიცდები: Shopify checkout-ზე მხოლოდ **Bogus Gateway** ჩანს — ეს ნორმალურია. LariPay API / dashboard / WooCommerce მაინც ტესტდება.

`scopes` Partners UI-ში **ცარიელი** დატოვე (არ ჩაწერო `write_payment_sessions` ხელით).

### `[target_url]: Required` (extensions/.../shopify.extension.toml)

Payment extension-ს სჭირდება targeting. ორივე ფაილში უნდა იყოს:

```toml
[[extensions.targeting]]
target = "payments.offsite.render"
```

(უკვე დამატებულია `georgia-pay-offsite` და `georgia-pay-installments-offsite`-ში.)

### `At least one specification (.toml OR .json) file is required`

ხშირად **Shopify CLI 3.84.x** ბაგია. განაახლე პროექტში CLI და თავიდან deploy:

```bash
cd integrations/shopify/georgia-pay-app
npm install
npx shopify version   # უნდა იყოს ≥ 3.92
npx shopify auth login
npx shopify app deploy --allow-updates
```

CLI იყენებს `shopify.app.larypay.toml`-ს (linked LariPay აპი). URL-ები: `https://laripay.vercel.app`.

## პრობლემები

| სიმპტომი | მიზეზი |
|----------|--------|
| 422 payment_session | ბანკი არ არის კონფიგურირებული მერჩანტისთვის |
| არ ჩანს გადახდის მეთოდი | Extension არ არის deploy / GEL არაა |
| return-ზე ჩერდება | ბანკის სტატუსი pending — webhook ან poll |
| deploy auth timeout | `npx shopify auth login` ტერმინალში, შემდეგ deploy |

Logs: Vercel → Functions → `payment_session`, `return`, `webhooks/tbc` ან `webhooks/bog`.
