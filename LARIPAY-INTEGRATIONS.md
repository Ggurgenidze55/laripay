# LariPay.ai — ინტეგრაციები (ყველა ქართული ბანკი + e-commerce)

გადახდა მხოლოდ **ბანკის გვერდზე** (ბარათი / Apple Pay / Google Pay ბანკის hosted checkout-ზე). LariPay-ზე ბარათის მონაცემები არ ინახება.

## მხარდაჭერილი ბანკები

| ID | ბანკი | სტატუსი |
|----|--------|---------|
| `tbc` | TBC Pay | **live** |
| `bog` | საქართველოს ბანკი (BOG Pay) | **live** |
| `liberty` | ლიბერთი ბანკი | beta (API credentials) |
| `credo` | კრედო ბანკი | beta |
| `cartu` | კარტუ ბანკი | beta |
| `basis` | ბაზის ბანკი | beta |
| `flitt` | Flitt (აგრეგატორი) | beta |

სია API-დან: `GET /api/v1/banks` (Bearer `sk_...`).

**Shopify:** ერთი აპი, ბანკის არჩევა Settings-ში — ცალკე აპი თითო ბანკზე არ სჭირდება.

---

## პლატფორმები

| პლატფორმა | ფოლდერი | ინტეგრაციის header |
|-----------|---------|-------------------|
| **Shopify** | `integrations/shopify/georgia-pay-app/` | `shopify` |
| **WooCommerce / WordPress** | `integrations/wordpress/georgia-pay/` | `woocommerce` |
| **CS-Cart** | `integrations/cscart/app/addons/laripay_georgia/` | `cscart` |
| **OpenCart 3** | `integrations/opencart/upload/` | `opencart` |
| **PrestaShop 8** | `integrations/prestashop/laripaygeorgia/` | `prestashop` |
| **Magento** | API + `X-LariPay-Integration: magento` | `magento` |
| **ნებისმიერი საიტი** | [LARIPAY-API.md](./LARIPAY-API.md) | `api` |

საერთო PHP კლიენტი: `integrations/shared/laripay-client.php`.

---

## Checkout API (ყველა პლატფორმისთვის)

```http
POST https://LARIPAY_HOST/api/v1/checkout/sessions
Authorization: Bearer sk_live_...
Content-Type: application/json
X-LariPay-Integration: woocommerce
X-LariPay-Integration-Ref: https://my-store.ge

{
  "amount": 150.00,
  "currency": "GEL",
  "provider": "liberty",
  "success_url": "https://example.com/thanks",
  "cancel_url": "https://example.com/cart",
  "client_reference_id": "order-999"
}
```

პასუხი: `{ "url": "https://bank...", "platform_fee": 1.5 }` — მომხმარებელი გადადის `url`-ზე.

---

## ბანკის credentials

### TBC / BOG (live)
მერჩანტის dashboard ან Shopify Settings / `.env`:
- TBC: `TBC_CLIENT_ID`, `TBC_CLIENT_SECRET`
- BOG: `BOG_PUBLIC_KEY`, `BOG_SECRET_KEY`

### სხვა ბანკები (beta)
Env ან merchant `bankCredentials` JSON:
- `{PREFIX}_API_ORIGIN`
- `{PREFIX}_MERCHANT_ID`
- `{PREFIX}_SECRET_KEY`

მაგ. Liberty: `LIBERTY_API_ORIGIN`, `LIBERTY_MERCHANT_ID`, `LIBERTY_SECRET_KEY`.

Sandbox mock (მხოლოდ dev): `{BANK}_SANDBOX_MOCK=1`.

---

## WooCommerce

1. `georgia-pay` → `wp-content/plugins/`
2. Payments → **LariPay.ai — Georgian banks**
3. API URL + `sk_...` + **Bank provider** (ყველა ბანკი dropdown-ში)

---

## Shopify

1. დააინსტალირე აპი → LariPay merchant ავტომატურად
2. Settings → აირჩიე ბანკი და credentials
3. GEL + Georgia Pay payments extension

---

## CS-Cart / OpenCart / PrestaShop

იხილე შესაბამისი `integrations/*` README და დააკოპირე მოდული. ყველა იყენებს იგივე `POST /api/v1/checkout/sessions`-ს.

---

## კომისია / გამოწერა

იგივე ლოგიკა ყველა ბანკზე: 1% ან აქტიური subscription → 0% platform fee.

---

## 4. ონლაინ განვადება (Installments)

იგივე პრინციპი: **ბანკის hosted გვერდზე** განვადების არჩევა — LariPay-ზე სესხის/ბარათის მონაცემები არ ინახება.

### API

```http
POST /api/v1/checkout/installment-sessions
Authorization: Bearer sk_live_...

{
  "amount": 1200.00,
  "currency": "GEL",
  "provider": "tbc",
  "installment_terms": 12,
  "success_url": "https://store.ge/thanks",
  "cancel_url": "https://store.ge/cart",
  "client_reference_id": "order-42"
}
```

ან `POST /api/v1/checkout/sessions` + `"payment_mode": "installment"`.

```http
GET /api/v1/installments/banks
```

→ ბანკები, ვადები (3/6/12/24 თვე), მინ. თანხა.

### პლატფორმები

| პლატფორმა | გზა |
|-----------|-----|
| **Shopify** | ახალი extension `georgia-pay-installments-offsite` → `/api/payment_session_installment` |
| **WooCommerce** | gateway **LariPay.ai — Online installments** (`georgia_pay_installments`) |
| **CS-Cart** | addon `laripay_georgia_installments` |
| **OpenCart / PrestaShop** | იგივე `LariPay_Client::create_installment_checkout_session()` |
| **API** | `/api/v1/checkout/installment-sessions` |

### ბანკები

TBC, BOG (live), Liberty, Credo, Cartu, Basis, Flitt (beta) — იგივე credentials რაც ბარათის გადახდაზე.

---

## 5. მიწოდება / კურიერი (Delivery)

იგივე LariPay API + merchant key. სრული დოკუმენტაცია: [LARIPAY-DELIVERY-INTEGRATIONS.md](./LARIPAY-DELIVERY-INTEGRATIONS.md)

| API | დანიშნულება |
|-----|------------|
| `GET /api/v1/delivery/carriers` | კურიერების სია |
| `POST /api/v1/delivery/rates` | shipping quote checkout-ზე |
| `POST /api/v1/delivery/shipments` | გაგზავნის შექმნა |
| `GET /api/v1/delivery/shipments/:id?track=1` | tracking |

**WooCommerce:** პლაგინი `integrations/wordpress/georgia-delivery/`  
**CS-Cart:** addon `laridelivery_georgia`

---

## 6. საწყობის სინქრონიზაცია (Warehouse / ERP)

Fina, FMG Soft, Optimo WMS, 1C, Balance, Libra, Orbit, SAP B1 და სხვა — იგივე LariPay merchant key.

სრული დოკუმენტაცია: [LARIPAY-WAREHOUSE-INTEGRATIONS.md](./LARIPAY-WAREHOUSE-INTEGRATIONS.md)

| API | დანიშნულება |
|-----|------------|
| `GET /api/v1/warehouse/systems` | WMS/ERP სისტემების სია |
| `GET /api/v1/warehouse/locations` | საწყობის ლოკაციები |
| `POST /api/v1/warehouse/sync/products` | პროდუქტების sync |
| `POST /api/v1/warehouse/sync/stock` | მარაგის sync |
| `POST /api/v1/warehouse/sync/orders` | შეკვეთების გადაგზავნა საწყობში |
| `GET /api/v1/warehouse/sync/jobs/:id` | sync job სტატუსი |

**WooCommerce:** `integrations/wordpress/georgia-warehouse/`
