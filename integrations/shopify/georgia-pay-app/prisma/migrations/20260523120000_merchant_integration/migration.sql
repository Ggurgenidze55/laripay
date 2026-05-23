-- Merchant integration channel (Shopify, WooCommerce, API, …)
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "integrationPlatform" TEXT;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "integrationRef" TEXT;
