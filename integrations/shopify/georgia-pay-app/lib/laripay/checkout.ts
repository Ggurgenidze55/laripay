import prisma from '@/lib/prisma';
import { getLariPayReturnUrl, getLariPayWebhookUrl } from '@/lib/laripay-env';
import { assertGelCurrency } from '@/lib/georgian-payments';
import { CHECKOUT_SESSION_TTL_MS } from './constants';
import { computePlatformFee } from './billing';
import { buildMerchantPaymentsClient, getMerchantBankConfig } from './merchant-config';
import { expireCheckoutSessionIfNeeded } from './checkout-expiry';
import type { AuthenticatedMerchant } from './auth';

export function hostedCheckoutPageUrl(sessionId: string): string {
  const base = (process.env.HOST || process.env.VERCEL_URL || 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
  const origin = base.startsWith('http') ? base : `https://${base}`;
  return `${origin}/checkout/ui/${sessionId}`;
}

export interface CreateCheckoutInput {
  amount: number;
  currency?: string;
  provider?: 'tbc' | 'bog';
  successUrl: string;
  cancelUrl?: string;
  clientReferenceId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  /** When `hosted`, customer picks bank on /checkout/ui/:id before redirect. */
  uiMode?: 'hosted' | 'redirect';
}

export async function createCheckoutSession(
  merchant: AuthenticatedMerchant,
  input: CreateCheckoutInput,
) {
  const currency = input.currency || 'GEL';
  assertGelCurrency(currency);

  const amount = Number(input.amount);
  if (!amount || amount < 0.01) {
    throw new Error('amount must be at least 0.01 GEL');
  }

  if (input.idempotencyKey) {
    const existing = await prisma.checkoutSession.findUnique({
      where: {
        merchantId_idempotencyKey: {
          merchantId: merchant.id,
          idempotencyKey: input.idempotencyKey,
        },
      },
      include: { paykaPayment: true },
    });
    if (existing) {
      return serializeCheckoutSession(existing);
    }
  }

  const fullMerchant = await prisma.merchant.findUniqueOrThrow({
    where: { id: merchant.id },
  });

  const config = await getMerchantBankConfig(merchant.id);
  const provider = (input.provider || config.provider) as 'tbc' | 'bog';

  if (provider === 'tbc' && !(config.tbcClientId && config.tbcClientSecret)) {
    throw new Error('TBC not configured for this merchant or platform');
  }
  if (provider === 'bog' && !(config.bogPublicKey && config.bogSecretKey)) {
    throw new Error('BOG not configured for this merchant or platform');
  }

  const fees = computePlatformFee(amount, fullMerchant);
  const expiresAt = new Date(Date.now() + CHECKOUT_SESSION_TTL_MS);
  const uiMode = input.uiMode === 'hosted' ? 'hosted' : 'redirect';

  const session = await prisma.checkoutSession.create({
    data: {
      merchantId: merchant.id,
      amount,
      currency,
      provider,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      clientReferenceId: input.clientReferenceId,
      idempotencyKey: input.idempotencyKey || null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      expiresAt,
      status: 'open',
    },
  });

  if (uiMode === 'hosted') {
    return {
      id: session.id,
      object: 'checkout.session' as const,
      mode: 'payment' as const,
      status: 'open' as const,
      amount: fees.grossAmount,
      currency,
      platform_fee: fees.platformFee,
      net_amount: fees.netAmount,
      fee_mode: fees.feeMode,
      commission_rate: fees.commissionRateBps / 100,
      provider,
      client_reference_id: input.clientReferenceId || null,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl || null,
      url: hostedCheckoutPageUrl(session.id),
      payment_id: null,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      created: Math.floor(session.createdAt.getTime() / 1000),
    };
  }

  const bank = await initiateBankPaymentForSession(session.id, provider);
  return {
    id: session.id,
    object: 'checkout.session' as const,
    mode: 'payment' as const,
    status: 'open' as const,
    amount: fees.grossAmount,
    currency,
    platform_fee: fees.platformFee,
    net_amount: fees.netAmount,
    fee_mode: fees.feeMode,
    commission_rate: fees.commissionRateBps / 100,
    provider,
    client_reference_id: input.clientReferenceId || null,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl || null,
    url: bank.redirectUrl,
    payment_id: bank.paymentId,
    expires_at: Math.floor(expiresAt.getTime() / 1000),
    created: Math.floor(session.createdAt.getTime() / 1000),
  };
}

/** Attach TBC/BOG redirect to an open checkout session (hosted UI confirm). */
export async function initiateBankPaymentForSession(sessionId: string, provider: 'tbc' | 'bog') {
  const session = await prisma.checkoutSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { paykaPayment: true },
  });

  if (session.redirectUrl && session.paykaPaymentId) {
    return {
      redirectUrl: session.redirectUrl,
      paymentId: session.paykaPaymentId,
    };
  }

  const fullMerchant = await prisma.merchant.findUniqueOrThrow({
    where: { id: session.merchantId },
  });
  const config = await getMerchantBankConfig(session.merchantId);
  const resolvedProvider = provider;

  if (resolvedProvider === 'tbc' && !(config.tbcClientId && config.tbcClientSecret)) {
    throw new Error('TBC not configured for this merchant or platform');
  }
  if (resolvedProvider === 'bog' && !(config.bogPublicKey && config.bogSecretKey)) {
    throw new Error('BOG not configured for this merchant or platform');
  }

  const fees = computePlatformFee(session.amount, fullMerchant);
  const returnUrl =
    getLariPayReturnUrl(session.id) ||
    `${process.env.HOST}/payment/return?paymentId=${encodeURIComponent(session.id)}&source=laripay`;
  const callbackUrl = getLariPayWebhookUrl(resolvedProvider) || `${process.env.HOST}/api/webhook`;

  const payments = buildMerchantPaymentsClient({ ...config, provider: resolvedProvider });
  const bankResult = await payments.createPayment(
    session.amount,
    session.currency,
    session.id,
    returnUrl,
    {
      provider: resolvedProvider,
      callbackUrl,
      successUrl: session.successUrl,
      failUrl: session.cancelUrl || session.successUrl,
    },
  );

  const paykaPayment =
    session.paykaPayment ??
    (await prisma.paykaPayment.create({
      data: {
        merchantId: session.merchantId,
        amount: session.amount,
        currency: session.currency,
        grossAmount: fees.grossAmount,
        platformFee: fees.platformFee,
        netAmount: fees.netAmount,
        feeMode: fees.feeMode,
        provider: resolvedProvider,
        bankReference: bankResult.paymentId || null,
        status: 'pending',
        clientReferenceId: session.clientReferenceId,
        metadata: session.metadata,
      },
    }));

  await prisma.checkoutSession.update({
    where: { id: session.id },
    data: {
      provider: resolvedProvider,
      bankReference: bankResult.paymentId || null,
      redirectUrl: bankResult.redirectUrl || null,
      paykaPaymentId: paykaPayment.id,
      status: 'open',
    },
  });

  return {
    redirectUrl: bankResult.redirectUrl,
    paymentId: paykaPayment.id,
  };
}

export async function getCheckoutSessionForMerchant(merchantId: string, sessionId: string) {
  const session = await prisma.checkoutSession.findFirst({
    where: { id: sessionId, merchantId },
    include: { paykaPayment: true },
  });
  if (!session) return null;

  const active = await expireCheckoutSessionIfNeeded(session);
  return serializeCheckoutSession(active);
}

export function serializeCheckoutSession(
  session: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    provider: string;
    successUrl: string;
    cancelUrl: string | null;
    clientReferenceId: string | null;
    redirectUrl: string | null;
    bankReference: string | null;
    paykaPaymentId: string | null;
    expiresAt: Date;
    createdAt: Date;
    paykaPayment?: {
      id: string;
      status: string;
      platformFee: number;
      netAmount: number;
      feeMode: string;
    } | null;
  },
) {
  return {
    id: session.id,
    object: 'checkout.session' as const,
    status: session.status,
    amount: session.amount,
    currency: session.currency,
    provider: session.provider,
    success_url: session.successUrl,
    cancel_url: session.cancelUrl,
    client_reference_id: session.clientReferenceId,
    url: session.redirectUrl,
    bank_reference: session.bankReference,
    payment_id: session.paykaPaymentId,
    platform_fee: session.paykaPayment?.platformFee ?? null,
    net_amount: session.paykaPayment?.netAmount ?? null,
    fee_mode: session.paykaPayment?.feeMode ?? null,
    payment_status: session.paykaPayment?.status ?? null,
    expires_at: Math.floor(session.expiresAt.getTime() / 1000),
    created: Math.floor(session.createdAt.getTime() / 1000),
  };
}
