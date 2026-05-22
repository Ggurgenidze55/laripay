-- CreateEnum
CREATE TYPE "CheckoutMode" AS ENUM ('REDIRECT', 'EMBEDDED', 'DIRECT');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'AUTHORIZED', 'APPROVED', 'FAILED', 'REFUNDED', 'DISPUTED', 'CANCELED');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GEL',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "checkoutMode" "CheckoutMode" NOT NULL DEFAULT 'REDIRECT',
    "paymentIntentId" TEXT,
    "clientReferenceId" TEXT,
    "description" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "methods" TEXT[] DEFAULT ARRAY['card', 'wallets', 'banks']::TEXT[],
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantCheckoutBranding" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#3b82f6',
    "accentColor" TEXT DEFAULT '#06b6d4',
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "layout" TEXT NOT NULL DEFAULT 'default',
    "methodOrder" TEXT[] DEFAULT ARRAY['card', 'apple_pay', 'google_pay', 'open_banking']::TEXT[],
    "gradient" TEXT,
    "fullscreen" BOOLEAN NOT NULL DEFAULT false,
    "compact" BOOLEAN NOT NULL DEFAULT false,
    "locales" TEXT[] DEFAULT ARRAY['en', 'ka']::TEXT[],
    "customCss" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantCheckoutBranding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmbeddedCheckoutSession" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "options" JSONB,
    "params" JSONB,
    "theme" JSONB,
    "messages" JSONB,
    "fieldsCustom" JSONB,
    "cssVariables" JSONB,
    "methods" TEXT[] DEFAULT ARRAY['card', 'wallets', 'banks']::TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmbeddedCheckoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardToken" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "customerId" TEXT,
    "tokenRef" TEXT NOT NULL,
    "last4" TEXT,
    "brand" TEXT,
    "expMonth" INTEGER,
    "expYear" INTEGER,
    "fingerprint" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "encrypted" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrPayment" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "orderId" TEXT,
    "code" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GEL',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payloadUrl" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QrPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantCheckoutBranding_merchantId_key" ON "MerchantCheckoutBranding"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "EmbeddedCheckoutSession_orderId_key" ON "EmbeddedCheckoutSession"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "EmbeddedCheckoutSession_sessionToken_key" ON "EmbeddedCheckoutSession"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "CardToken_tokenRef_key" ON "CardToken"("tokenRef");

-- CreateIndex
CREATE UNIQUE INDEX "QrPayment_code_key" ON "QrPayment"("code");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantCheckoutBranding" ADD CONSTRAINT "MerchantCheckoutBranding_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbeddedCheckoutSession" ADD CONSTRAINT "EmbeddedCheckoutSession_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbeddedCheckoutSession" ADD CONSTRAINT "EmbeddedCheckoutSession_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardToken" ADD CONSTRAINT "CardToken_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrPayment" ADD CONSTRAINT "QrPayment_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrPayment" ADD CONSTRAINT "QrPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
