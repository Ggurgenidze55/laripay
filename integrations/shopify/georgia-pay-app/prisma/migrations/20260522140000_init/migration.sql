-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'tbc',
    "testMode" BOOLEAN NOT NULL DEFAULT true,
    "tbcApiKey" TEXT,
    "tbcClientId" TEXT,
    "tbcClientSecret" TEXT,
    "bogPublicKey" TEXT,
    "bogSecretKey" TEXT,
    "bogCallbackPublicKey" TEXT,
    "paykaApiKey" TEXT,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "shopifyPaymentId" TEXT NOT NULL,
    "shopifyPaymentGid" TEXT NOT NULL,
    "shopifyGroup" TEXT,
    "bank" TEXT NOT NULL,
    "bankReference" TEXT,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "cancelUrl" TEXT,
    "test" BOOLEAN NOT NULL DEFAULT false,
    "shopifyRequestId" TEXT,
    "authorizationExpiresAt" TIMESTAMP(3),
    "networkTransactionId" TEXT,
    "rawSession" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundRecord" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "shopifyRefundId" TEXT NOT NULL,
    "shopifyRefundGid" TEXT NOT NULL,
    "shopifyPaymentId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "bankReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefundRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "billingMode" TEXT NOT NULL DEFAULT 'COMMISSION',
    "commissionRateBps" INTEGER NOT NULL DEFAULT 100,
    "subscriptionPlanId" TEXT,
    "subscriptionActiveUntil" TIMESTAMP(3),
    "webhookSecret" TEXT NOT NULL,
    "defaultProvider" TEXT NOT NULL DEFAULT 'tbc',
    "tbcClientId" TEXT,
    "tbcClientSecret" TEXT,
    "tbcApiKey" TEXT,
    "bogPublicKey" TEXT,
    "bogSecretKey" TEXT,
    "bogCallbackPublicKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceGel" DOUBLE PRECISION NOT NULL,
    "interval" TEXT NOT NULL DEFAULT 'month',
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "name" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckoutSession" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GEL',
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "successUrl" TEXT NOT NULL,
    "cancelUrl" TEXT,
    "clientReferenceId" TEXT,
    "idempotencyKey" TEXT,
    "metadata" TEXT,
    "bankReference" TEXT,
    "redirectUrl" TEXT,
    "paykaPaymentId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaykaPayment" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GEL',
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "feeMode" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "bankReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "clientReferenceId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaykaPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaykaRefund" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GEL',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "bankReference" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaykaRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "endpointId" TEXT,
    "event" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "responseCode" INTEGER,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_domain_key" ON "Shop"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shopId_key" ON "ShopSettings"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_shopifyPaymentId_key" ON "PaymentRecord"("shopifyPaymentId");

-- CreateIndex
CREATE INDEX "PaymentRecord_shopDomain_idx" ON "PaymentRecord"("shopDomain");

-- CreateIndex
CREATE INDEX "PaymentRecord_bankReference_idx" ON "PaymentRecord"("bankReference");

-- CreateIndex
CREATE INDEX "PaymentRecord_status_idx" ON "PaymentRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RefundRecord_shopifyRefundId_key" ON "RefundRecord"("shopifyRefundId");

-- CreateIndex
CREATE INDEX "RefundRecord_shopifyPaymentId_idx" ON "RefundRecord"("shopifyPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_email_key" ON "Merchant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_slug_key" ON "Merchant"("slug");

-- CreateIndex
CREATE INDEX "Merchant_slug_idx" ON "Merchant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_code_key" ON "SubscriptionPlan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_merchantId_idx" ON "ApiKey"("merchantId");

-- CreateIndex
CREATE INDEX "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutSession_paykaPaymentId_key" ON "CheckoutSession"("paykaPaymentId");

-- CreateIndex
CREATE INDEX "CheckoutSession_merchantId_idx" ON "CheckoutSession"("merchantId");

-- CreateIndex
CREATE INDEX "CheckoutSession_status_idx" ON "CheckoutSession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutSession_merchantId_idempotencyKey_key" ON "CheckoutSession"("merchantId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "PaykaPayment_merchantId_idx" ON "PaykaPayment"("merchantId");

-- CreateIndex
CREATE INDEX "PaykaPayment_bankReference_idx" ON "PaykaPayment"("bankReference");

-- CreateIndex
CREATE INDEX "PaykaPayment_status_idx" ON "PaykaPayment"("status");

-- CreateIndex
CREATE INDEX "PaykaRefund_paymentId_idx" ON "PaykaRefund"("paymentId");

-- CreateIndex
CREATE INDEX "PaykaRefund_merchantId_idx" ON "PaykaRefund"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "PaykaRefund_merchantId_idempotencyKey_key" ON "PaykaRefund"("merchantId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_merchantId_idx" ON "WebhookEndpoint"("merchantId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_merchantId_idx" ON "WebhookDelivery"("merchantId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_status_idx" ON "WebhookDelivery"("status");

-- AddForeignKey
ALTER TABLE "ShopSettings" ADD CONSTRAINT "ShopSettings_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Merchant" ADD CONSTRAINT "Merchant_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "SubscriptionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutSession" ADD CONSTRAINT "CheckoutSession_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutSession" ADD CONSTRAINT "CheckoutSession_paykaPaymentId_fkey" FOREIGN KEY ("paykaPaymentId") REFERENCES "PaykaPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaykaPayment" ADD CONSTRAINT "PaykaPayment_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaykaRefund" ADD CONSTRAINT "PaykaRefund_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaykaRefund" ADD CONSTRAINT "PaykaRefund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "PaykaPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

