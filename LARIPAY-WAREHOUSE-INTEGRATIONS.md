# LariPay.ai — Warehouse / ERP sync (Georgia)

Sync **products**, **stock**, and **orders** between your e-commerce store and Georgian warehouse systems via one LariPay API.

## Supported systems

| ID | System | Status |
|----|--------|--------|
| `fina` | Fina | **live** |
| `fmg_soft` | FMG Soft | **live** |
| `optimo` | Optimo WMS | **live** |
| `one_c` | 1C:Enterprise | **live** |
| `balance` | Balance | beta |
| `libra` | Libra Software | beta |
| `orbit` | Orbit ERP | beta |
| `micros` | Micros / Business | beta |
| `sap_b1` | SAP Business One | beta |
| `logista` | Logista WMS | beta |

List: `GET /api/v1/warehouse/systems`

## API

### Warehouse locations

```http
GET /api/v1/warehouse/locations?system=fina
```

### Sync products (pull/push)

```http
POST /api/v1/warehouse/sync/products
{
  "system": "fina",
  "direction": "pull",
  "warehouse_id": "main",
  "since": "2026-05-01T00:00:00Z"
}
```

### Sync stock

```http
POST /api/v1/warehouse/sync/stock
{
  "system": "fmg_soft",
  "direction": "pull",
  "skus": ["SKU-001", "SKU-002"]
}
```

### Push orders to warehouse

```http
POST /api/v1/warehouse/sync/orders
{
  "system": "optimo",
  "orders": [{
    "reference": "order-1001",
    "lines": [{ "sku": "SKU-001", "quantity": 2 }],
    "total_gel": 150.00
  }]
}
```

### Job status

```http
GET /api/v1/warehouse/sync/jobs/{job_id}
```

## Credentials

Per system (env or `Merchant.warehouseCredentials` JSON):

- `{PREFIX}_API_ORIGIN`
- `{PREFIX}_API_KEY`
- optional `{PREFIX}_COMPANY_ID`

Examples: `FINA_API_ORIGIN`, `FMG_SOFT_API_KEY`, `OPTIMO_WMS_API_ORIGIN`.

Dev mock: `FINA_SANDBOX_MOCK=1`.

## WooCommerce plugin

Path: `integrations/wordpress/georgia-warehouse/`

1. Install plugin
2. WooCommerce → **Warehouse Sync**
3. LariPay API URL + `sk_...` + system (Fina / FMG / Optimo…)
4. **Pull stock** manually or auto-push orders on Processing

## CS-Cart / other platforms

Use `integrations/shared/laripay-warehouse-client.php` — same endpoints, same merchant API key as payments & delivery.
