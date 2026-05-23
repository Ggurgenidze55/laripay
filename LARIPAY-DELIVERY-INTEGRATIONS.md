# LariPay.ai — Georgian delivery / courier integrations

One **LariPay API** for all Georgian couriers — rates at checkout, shipment creation, tracking.

## Carriers

| ID | Carrier | Status |
|----|---------|--------|
| `delivo` | Delivo | **live** |
| `onway` | OnWay | **live** |
| `georgian_post` | საქართველოს ფოსტა | **live** |
| `dhl` | DHL Georgia | **live** |
| `glovo` | Glovo | beta |
| `wolt` | Wolt Drive | beta |
| `bolt` | Bolt Delivery | beta |
| `kiwipost` | KiwiPost | beta |
| `optimo` | Optimo Express | beta |
| `multiline` | MultiLine Express | beta |
| `fedex` | FedEx Georgia | beta |
| `ups` | UPS Georgia | beta |

List: `GET /api/v1/delivery/carriers` (Bearer `sk_...`).

## API

### Rates (checkout shipping quote)

```http
POST /api/v1/delivery/rates
Authorization: Bearer sk_live_...
Content-Type: application/json

{
  "carrier": "delivo",
  "weight_kg": 2.5,
  "from": { "city": "Tbilisi", "address_line1": "Rustaveli 1" },
  "to": { "city": "Batumi", "address_line1": "Gogebashvili 12", "phone": "+995..." }
}
```

Response: `{ "rates": [{ "service": "standard", "price_gel": 9.5, "eta_label": "1 business day" }] }`

### Create shipment

```http
POST /api/v1/delivery/shipments
```

Returns `tracking_number`, `tracking_url`, `label_url`.

### Track

```http
GET /api/v1/delivery/shipments/{id}?track=1
```

## Platform plugins

| Platform | Path |
|----------|------|
| **WooCommerce** | `integrations/wordpress/georgia-delivery/` |
| **CS-Cart** | `integrations/cscart/app/addons/laridelivery_georgia/` |
| **Shared PHP client** | `integrations/shared/laripay-delivery-client.php` |
| **Shopify / others** | REST API + `X-LariPay-Integration` header |

## Merchant credentials

Per carrier env or `Merchant.carrierCredentials` JSON:

- `{PREFIX}_API_ORIGIN`
- `{PREFIX}_API_KEY`
- optional `{PREFIX}_MERCHANT_ID`

Example: `DELIVO_API_ORIGIN`, `DELIVO_API_KEY`.

Sandbox dev: `DELIVO_SANDBOX_MOCK=1` returns mock rates/tracking.

## WooCommerce setup

1. Copy `georgia-delivery` → `wp-content/plugins/`
2. WooCommerce → Settings → Shipping → add **LariPay.ai — Georgian couriers**
3. LariPay API URL + `sk_...` + default carrier + ship-from address
4. Checkout shows live courier rates; optional auto-shipment on Processing

Same LariPay merchant API key as payments.
