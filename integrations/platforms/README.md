# E-commerce platform adapters

All adapters call the same LariPay API:

- `POST /api/v1/checkout/sessions` with `provider` = `tbc|bog|liberty|credo|cartu|basis|flitt`
- Bank-hosted redirect via response `url`
- Optional `GET /api/v1/banks` to list configured banks for the merchant

Use headers:

- `X-LariPay-Integration`: platform id (`shopify`, `woocommerce`, `cscart`, …)
- `X-LariPay-Integration-Ref`: store URL or shop domain

Shared PHP client: `../shared/laripay-client.php`.
