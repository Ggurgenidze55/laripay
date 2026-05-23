-- Link Shopify shops to merchants by ID (do not store API secrets on ShopSettings).
ALTER TABLE "ShopSettings" ADD COLUMN "laripayMerchantId" TEXT;
ALTER TABLE "ShopSettings" DROP COLUMN IF EXISTS "paykaApiKey";
