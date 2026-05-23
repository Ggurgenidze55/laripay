ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "defaultWarehouseSystem" TEXT NOT NULL DEFAULT 'fina';
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "warehouseCredentials" JSONB;

CREATE TABLE IF NOT EXISTS "WarehouseSyncJob" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "syncedCount" INTEGER NOT NULL DEFAULT 0,
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseSyncJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WarehouseSyncJob_merchantId_idx" ON "WarehouseSyncJob"("merchantId");
CREATE INDEX IF NOT EXISTS "WarehouseSyncJob_system_idx" ON "WarehouseSyncJob"("system");
CREATE INDEX IF NOT EXISTS "WarehouseSyncJob_status_idx" ON "WarehouseSyncJob"("status");
CREATE INDEX IF NOT EXISTS "WarehouseSyncJob_kind_idx" ON "WarehouseSyncJob"("kind");

DO $$ BEGIN
 ALTER TABLE "WarehouseSyncJob" ADD CONSTRAINT "WarehouseSyncJob_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
