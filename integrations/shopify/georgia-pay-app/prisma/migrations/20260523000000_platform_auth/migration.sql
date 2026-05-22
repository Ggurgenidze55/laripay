-- Platform auth (2FA, login, registration)

CREATE TABLE "PlatformUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "phoneVerifiedAt" TIMESTAMP(3),
    "emailVerifiedAt" TIMESTAMP(3),
    "twoFactorRequired" BOOLEAN NOT NULL DEFAULT true,
    "role" TEXT NOT NULL DEFAULT 'merchant',
    "merchantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthPendingRegistration" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "slug" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "phoneVerifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthPendingRegistration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthLoginChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "phoneVerifiedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthLoginChallenge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthOtpChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "pendingId" TEXT,
    "loginId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "channel" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthOtpChallenge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformUser_email_key" ON "PlatformUser"("email");
CREATE UNIQUE INDEX "PlatformUser_merchantId_key" ON "PlatformUser"("merchantId");
CREATE INDEX "PlatformUser_email_idx" ON "PlatformUser"("email");
CREATE INDEX "PlatformUser_phone_idx" ON "PlatformUser"("phone");

CREATE INDEX "AuthPendingRegistration_email_idx" ON "AuthPendingRegistration"("email");

CREATE INDEX "AuthLoginChallenge_userId_idx" ON "AuthLoginChallenge"("userId");

CREATE INDEX "AuthOtpChallenge_pendingId_channel_idx" ON "AuthOtpChallenge"("pendingId", "channel");
CREATE INDEX "AuthOtpChallenge_loginId_channel_idx" ON "AuthOtpChallenge"("loginId", "channel");
CREATE INDEX "AuthOtpChallenge_email_purpose_idx" ON "AuthOtpChallenge"("email", "purpose");

ALTER TABLE "AuthLoginChallenge" ADD CONSTRAINT "AuthLoginChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PlatformUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuthOtpChallenge" ADD CONSTRAINT "AuthOtpChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PlatformUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlatformUser" ADD CONSTRAINT "PlatformUser_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
