ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "defaultCarrier" TEXT NOT NULL DEFAULT 'delivo';
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "carrierCredentials" JSONB;

CREATE TABLE IF NOT EXISTS "DeliveryShipment" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "service" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'created',
    "trackingNumber" TEXT,
    "externalId" TEXT,
    "trackingUrl" TEXT,
    "labelUrl" TEXT,
    "priceGel" DOUBLE PRECISION,
    "clientReferenceId" TEXT,
    "fromAddress" JSONB,
    "toAddress" JSONB,
    "weightKg" DOUBLE PRECISION,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryShipment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DeliveryShipment_merchantId_idx" ON "DeliveryShipment"("merchantId");
CREATE INDEX IF NOT EXISTS "DeliveryShipment_carrier_idx" ON "DeliveryShipment"("carrier");
CREATE INDEX IF NOT EXISTS "DeliveryShipment_trackingNumber_idx" ON "DeliveryShipment"("trackingNumber");
CREATE INDEX IF NOT EXISTS "DeliveryShipment_clientReferenceId_idx" ON "DeliveryShipment"("clientReferenceId");

DO $$ BEGIN
 ALTER TABLE "DeliveryShipment" ADD CONSTRAINT "DeliveryShipment_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
