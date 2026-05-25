-- CreateTable
CREATE TABLE "MerchantService" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "paidUntil" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "priceGel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suspendedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MerchantService_merchantId_idx" ON "MerchantService"("merchantId");

-- CreateIndex
CREATE INDEX "MerchantService_serviceId_idx" ON "MerchantService"("serviceId");

-- CreateIndex
CREATE INDEX "MerchantService_paidUntil_idx" ON "MerchantService"("paidUntil");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantService_merchantId_serviceId_key" ON "MerchantService"("merchantId", "serviceId");

-- AddForeignKey
ALTER TABLE "MerchantService" ADD CONSTRAINT "MerchantService_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
