-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "bankCredentials" JSONB;
ALTER TABLE "ShopSettings" ADD COLUMN IF NOT EXISTS "bankCredentials" JSONB;
