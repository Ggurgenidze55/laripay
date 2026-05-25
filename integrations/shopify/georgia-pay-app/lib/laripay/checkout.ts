import prisma from '@/lib/prisma';
import { getLariPayReturnUrl, getLariPayWebhookUrl } from '@/lib/laripay-env';
import { assertGelCurrency } from '@/lib/georgian-payments';
import { CHECKOUT_SESSION_TTL_MS } from './constants';
import { computePlatformFee } from './billing';
import {
  buildMerchantPaymentsClient,
  getMerchantBankConfig,
  isBankConfigured,
} from './merchant-config';
import { expireCheckoutSessionIfNeeded } from './checkout-expiry';
import type { AuthenticatedMerchant } from './auth';
import type { GeorgianBankId } from '@/lib/georgian-banks/registry';
import { georgianBankLabel, isGeorgianBankId } from '@/lib/georgian-banks/registry';
import type { PaymentMode } from '@/lib/georgian-banks/installments';
import {
  getInstallmentBank,
  validateInstallmentTerms,
} from '@/lib/georgian-banks/installments';

export interface CreateCheckoutInput {
  amount: number;
  currency?: string;
  provider?: GeorgianBankId;
  paymentMode?: PaymentMode;
  installmentTerms?: number;
  successUrl: string;
  cancelUrl?: string;
  clientReferenceId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

/** Create checkout session and redirect URL to bank-hosted page (no card data on LariPay). */
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
  const providerInput = input.provider;
  const provider = (
    providerInput && isGeorgianBankId(providerInput) ? providerInput : config.provider
  ) as GeorgianBankId;

  if (!isBankConfigured(config, provider)) {
    throw new Error(
      `${georgianBankLabel(provider, 'en')} is not configured for this merchant. Add bank credentials in dashboard.`,
    );
  }

  const paymentMode: PaymentMode = input.paymentMode === 'installment' ? 'installment' : 'card';
  const installmentTerms =
    input.installmentTerms != null ? Number(input.installmentTerms) : null;

  if (paymentMode === 'installment') {
    const installmentBank = getInstallmentBank(provider);
    if (!installmentBank) {
      throw new Error(`Installments not supported for provider ${provider}`);
    }
    if (amount < installmentBank.minAmountGel) {
      throw new Error(
        `Minimum installment amount is ${installmentBank.minAmountGel} GEL for ${georgianBankLabel(provider, 'en')}`,
      );
    }
    if (installmentTerms != null && !validateInstallmentTerms(provider, installmentTerms)) {
      throw new Error(
        `Invalid installment term. Allowed for ${provider}: ${installmentBank.terms.join(', ')} months`,
      );
    }
  }

  const fees = computePlatformFee(amount, fullMerchant);
  const expiresAt = new Date(Date.now() + CHECKOUT_SESSION_TTL_MS);

  const session = await prisma.checkoutSession.create({
    data: {
      merchantId: merchant.id,
      amount,
      currency,
      provider,
      paymentMode,
      installmentTerms,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      clientReferenceId: input.clientReferenceId,
      idempotencyKey: input.idempotencyKey || null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      expiresAt,
      status: 'open',
    },
  });

  await initiateBankPaymentForSession(session.id, provider);
  const fresh = await prisma.checkoutSession.findUniqueOrThrow({
    where: { id: session.id },
    include: { paykaPayment: true },
  });

  return serializeCheckoutSession(fresh, {
    mode: paymentMode === 'installment' ? 'installment' : 'payment',
    commission_rate: fees.commissionRateBps / 100,
  });
}

/** Attach bank redirect to an open checkout session. */
export async function initiateBankPaymentForSession(sessionId: string, provider: GeorgianBankId) {
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

  if (!isBankConfigured(config, resolvedProvider)) {
    throw new Error(
      `${georgianBankLabel(resolvedProvider, 'en')} is not configured for this merchant or platform`,
    );
  }

  const fees = computePlatformFee(session.amount, fullMerchant);
  const host = process.env.HOST || 'https://laripay.vercel.app';
  const returnUrl =
    getLariPayReturnUrl(session.id) ||
    `${host}/payment/return?paymentId=${encodeURIComponent(session.id)}&source=laripay`;

  if (config.testMode) {
    const testPaymentId = `test_${Date.now()}_${session.id.slice(0, 8)}`;
    const testRedirectUrl = `${host}/payment/test?session=${session.id}`;

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
          paymentMode: session.paymentMode || 'card',
          installmentTerms: session.installmentTerms,
          bankReference: testPaymentId,
          status: 'pending',
          clientReferenceId: session.clientReferenceId,
          metadata: session.metadata,
        },
      }));

    await prisma.checkoutSession.update({
      where: { id: session.id },
      data: {
        provider: resolvedProvider,
        bankReference: testPaymentId,
        redirectUrl: testRedirectUrl,
        paykaPaymentId: paykaPayment.id,
        status: 'open',
      },
    });

    console.log(`[checkout] TEST MODE: session ${session.id}, redirect: ${testRedirectUrl}`);
    return { redirectUrl: testRedirectUrl, paymentId: paykaPayment.id };
  }

  const callbackUrl = getLariPayWebhookUrl(resolvedProvider) || `${host}/api/webhook`;

  const payments = buildMerchantPaymentsClient({ ...config, provider: resolvedProvider });
  const bankResult = await payments.createPayment(
    session.amount,
    session.currency,
    session.id,
    returnUrl,
    {
      provider: resolvedProvider,
      paymentMode: session.paymentMode === 'installment' ? 'installment' : 'card',
      installmentTerms: session.installmentTerms ?? undefined,
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
        paymentMode: session.paymentMode || 'card',
        installmentTerms: session.installmentTerms,
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

/** Installment checkout — bank-hosted pay-in-parts (same redirect model as card). */
export async function createInstallmentCheckoutSession(
  merchant: AuthenticatedMerchant,
  input: Omit<CreateCheckoutInput, 'paymentMode'>,
) {
  return createCheckoutSession(merchant, { ...input, paymentMode: 'installment' });
}

export function serializeCheckoutSession(
  session: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    provider: string;
    paymentMode?: string | null;
    installmentTerms?: number | null;
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
  extras?: {
    mode?: 'payment' | 'installment';
    commission_rate?: number;
  },
) {
  return {
    id: session.id,
    object: 'checkout.session' as const,
    ...(extras?.mode ? { mode: extras.mode } : {}),
    status: session.status,
    amount: session.amount,
    currency: session.currency,
    provider: session.provider,
    payment_mode: session.paymentMode || 'card',
    installment_terms: session.installmentTerms ?? null,
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
    ...(extras?.commission_rate != null ? { commission_rate: extras.commission_rate } : {}),
    expires_at: Math.floor(session.expiresAt.getTime() / 1000),
    created: Math.floor(session.createdAt.getTime() / 1000),
  };
}
