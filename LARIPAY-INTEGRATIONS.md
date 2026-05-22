# LariPay.ai — ინტეგრაციები (პლაგინი + API)

ყველა გადახდა მიდის **LariPay.ai API**-ზე → TBC/BOG → **1% საკომისიო** ან **გამოწერა** (0% საკომისიო აქტიური პერიოდში).

## სად რა გამოიყენება

| პლატფორმა | გზა | დაყენება |
|-----------|-----|----------|
| **Shopify** | პლაგინი (აპი) | დააინსტალირე აპი → LariPay.ai merchant ავტომატურად იქმნება |
| **WooCommerce** | პლაგინი | `georgia-pay` → LariPay.ai API URL + `sk_test_...` |
| **სხვა** (Laravel, React, mobile) | **API** | [LARIPAY-API.md](./LARIPAY-API.md) |

---

## 1. WooCommerce პლაგინი

ფოლდერი: `integrations/wordpress/georgia-pay/`

### დაყენება

1. დააკოპირე `georgia-pay` → `wp-content/plugins/`
2. WooCommerce → Settings → Payments → **LariPay.ai — TBC & BOG**
3. ჩაწერე:
   - **LariPay.ai API URL** — მაგ. `https://your-ngrok.ngrok.app`
   - **Secret API key** — `sk_test_...` (`/api/laripay/setup`-დან)
   - **Bank provider** — TBC ან BOG
4. (რეკომენდებული) LariPay.ai admin-ში webhook:
   - URL: `https://your-store.ge/?wc-api=georgia_pay_laripay`
   - Events: `payment.succeeded`, `payment.failed`
   - **Webhook signing secret** — `whsec_...` (პლაგინის ველში)

მაღაზიის ვალუტა: **GEL**.

### რა ხდება checkout-ზე

1. `POST /api/v1/checkout/sessions` (LariPay.ai)
2. მომხმარებელი მიდის ბანკზე
3. Webhook ან return URL → შეკვეთა `processing` → `completed`

---

## 2. Shopify პლაგინი

ფოლდერი: `integrations/shopify/georgia-pay-app/`

### დაყენება

1. LariPay.ai სერვერი: `npm start` (ან production host)
2. `.env`-ში ბანკის sandbox keys (TBC/BOG)
3. `shopify auth login` → `shopify app dev`
4. მაღაზიაში ვალუტა **GEL**, გააქტიურე **Georgia Pay**

ყოველი მაღაზია იღებს **საკუთარ LariPay.ai merchant-ს** და API key-ს ინსტალაციისას.

### Admin

Shopify აპში: **LariPay.ai API key** (ავტომატური). ბანკის credentials — LariPay.ai სერვერის `.env`-ში (პლატფორმის დონეზე).

---

## 3. API (ნებისმიერი საიტი)

როცა პლაგინი არ არსებობს:

```http
POST https://LARIPAY_HOST/api/v1/checkout/sessions
Authorization: Bearer sk_test_...
Content-Type: application/json

{
  "amount": 150.00,
  "currency": "GEL",
  "provider": "tbc",
  "success_url": "https://example.com/thanks",
  "cancel_url": "https://example.com/cart",
  "client_reference_id": "order-999"
}
```

პასუხი: `{ "url": "https://bank...", "platform_fee": 1.5, "fee_mode": "commission" }`

### Webhook მიღება (შენი სერვერი)

Headers: `LariPay-Signature`, `LariPay-Timestamp`, `LariPay-Event`

Events: `payment.succeeded`, `payment.failed`, `checkout.session.completed`

### სტატუსის შემოწმება

```http
GET /api/v1/checkout/sessions/{id}
GET /api/v1/payments/{id}
GET /api/v1/balance
```

---

## ბილინგი (ყველა არხი)

| რეჟიმი | აღწერა |
|--------|--------|
| `COMMISSION` | **1%** თითო წარმატებულ გადახდაზე |
| `SUBSCRIPTION` | `starter` 49₾/თვე ან `pro` 149₾/თვე — 0% საკომისიო |

შეცვლა (admin):

```http
PATCH /api/laripay/merchants/{id}/billing
X-LariPay-Admin-Secret: ...
{ "billing_mode": "SUBSCRIPTION", "subscription_plan": "starter", "subscription_months": 1 }
```

---

## ახალი მერჩანტი (admin)

```http
POST /api/laripay/merchants
X-LariPay-Admin-Secret: ...

{ "name": "My Shop", "email": "owner@shop.ge", "billing_mode": "COMMISSION" }
```

პასუხში: `api_key` (ერთხელ ჩანს).

---

## სწრაფი ტესტი

1. `npm start`
2. `/api/laripay/setup` → `LARIPAY_DEMO_API_KEY`
3. `/demo` → API → TBC
4. WooCommerce: პლაგინი + იგივე API URL/key
