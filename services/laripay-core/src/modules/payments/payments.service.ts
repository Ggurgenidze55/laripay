import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { generateClientSecret } from '../../common/crypto';
import { decimalToNumber, toDecimal } from '../../common/utils/decimal.util';
import { FraudService } from '../fraud/fraud.service';
import { LedgerService } from '../ledger/ledger.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { EventsService } from '../events/events.service';
import { MockProvider } from './providers/mock.provider';
import { CreateIntentDto } from './dto/create-intent.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

const CHECKOUT_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class PaymentsService {
  private readonly providers: Map<string, MockProvider>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly fraud: FraudService,
    private readonly ledger: LedgerService,
    private readonly webhooks: WebhooksService,
    private readonly events: EventsService,
    private readonly mockProvider: MockProvider,
    config: ConfigService,
  ) {
    this.providers = new Map([[mockProvider.name, mockProvider]]);
    void config;
  }

  private getProvider(name: string) {
    const provider = this.providers.get(name);
    if (!provider) throw new BadRequestException(`Unknown provider: ${name}`);
    return provider;
  }

  private serializeIntent(intent: {
    id: string;
    amount: Prisma.Decimal;
    currency: string;
    status: PaymentStatus;
    clientSecret: string;
    clientReferenceId: string | null;
    metadata: Prisma.JsonValue;
    riskScore: number | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: intent.id,
      object: 'payment_intent',
      amount: decimalToNumber(intent.amount),
      currency: intent.currency,
      status: intent.status,
      client_secret: intent.clientSecret,
      client_reference_id: intent.clientReferenceId,
      metadata: intent.metadata,
      risk_score: intent.riskScore,
      created: Math.floor(intent.createdAt.getTime() / 1000),
      updated: Math.floor(intent.updatedAt.getTime() / 1000),
    };
  }

  async createIntent(merchantId: string, dto: CreateIntentDto, idempotencyKey?: string, ip?: string) {
    if (idempotencyKey) {
      const existing = await this.prisma.paymentIntent.findUnique({
        where: { merchantId_idempotencyKey: { merchantId, idempotencyKey } },
      });
      if (existing) return this.serializeIntent(existing);
    }

    const merchant = await this.prisma.merchant.findUniqueOrThrow({ where: { id: merchantId } });
    const fraudResult = await this.fraud.scoreTransaction({
      merchantId,
      amount: dto.amount,
      currency: dto.currency || 'GEL',
      ipAddress: ip,
    });

    if (fraudResult.decision === 'block') {
      throw new ForbiddenException('Transaction blocked by fraud rules');
    }

    const intent = await this.prisma.paymentIntent.create({
      data: {
        merchantId,
        amount: toDecimal(dto.amount),
        currency: dto.currency || 'GEL',
        provider: merchant.defaultProvider,
        captureMethod: dto.captureMethod || 'automatic',
        clientSecret: generateClientSecret(),
        idempotencyKey,
        clientReferenceId: dto.clientReferenceId,
        successUrl: dto.successUrl,
        cancelUrl: dto.cancelUrl,
        metadata: dto.metadata as Prisma.InputJsonValue,
        riskScore: fraudResult.score,
        expiresAt: new Date(Date.now() + CHECKOUT_TTL_MS),
      },
    });

    await this.events.logEvent('payments', {
      type: 'payment_intent.created',
      merchantId,
      entityId: intent.id,
      payload: { amount: dto.amount, currency: intent.currency },
    });

    return this.serializeIntent(intent);
  }

  async getIntent(merchantId: string, intentId: string) {
    const intent = await this.prisma.paymentIntent.findFirst({
      where: { id: intentId, merchantId },
      include: { payment: true },
    });
    if (!intent) throw new NotFoundException('Payment intent not found');
    return {
      ...this.serializeIntent(intent),
      payment: intent.payment
        ? {
            id: intent.payment.id,
            status: intent.payment.status,
            amount: decimalToNumber(intent.payment.amount),
            net_amount: decimalToNumber(intent.payment.netAmount),
            platform_fee: decimalToNumber(intent.payment.platformFee),
          }
        : null,
    };
  }

  async authorize(merchantId: string, intentId: string, ip?: string) {
    const intent = await this.prisma.paymentIntent.findFirst({
      where: { id: intentId, merchantId },
      include: { payment: true },
    });
    if (!intent) throw new NotFoundException('Payment intent not found');
    if (intent.payment) return { intent: this.serializeIntent(intent), payment: intent.payment };

    const fraudResult = await this.fraud.scoreTransaction({
      merchantId,
      amount: decimalToNumber(intent.amount),
      currency: intent.currency,
      ipAddress: ip,
      paymentId: undefined,
    });
    if (fraudResult.decision === 'block') {
      throw new ForbiddenException('Transaction blocked by fraud rules');
    }

    const provider = this.getProvider(intent.provider);
    const auth = await provider.authorize({
      intentId: intent.id,
      amount: decimalToNumber(intent.amount),
      currency: intent.currency,
    });

    const merchant = await this.prisma.merchant.findUniqueOrThrow({ where: { id: merchantId } });
    const gross = decimalToNumber(intent.amount);
    const platformFee = Math.round((gross * merchant.commissionRateBps) / 10000 * 100) / 100;
    const netAmount = gross - platformFee;

    const payment = await this.prisma.payment.create({
      data: {
        merchantId,
        intentId: intent.id,
        amount: intent.amount,
        currency: intent.currency,
        status: auth.status,
        provider: intent.provider,
        providerRef: auth.providerRef,
        grossAmount: toDecimal(gross),
        platformFee: toDecimal(platformFee),
        netAmount: toDecimal(netAmount),
        authorizedAt: new Date(),
      },
    });

    await this.prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: PaymentStatus.AUTHORIZED, riskScore: fraudResult.score },
    });

    if (intent.captureMethod === 'automatic') {
      return this.capture(merchantId, intent.id);
    }

    await this.webhooks.emitEvent(merchantId, 'payment.authorized', {
      payment_id: payment.id,
      intent_id: intent.id,
      amount: gross,
      status: auth.status,
    });

    return {
      intent: this.serializeIntent({ ...intent, status: PaymentStatus.AUTHORIZED }),
      payment: {
        id: payment.id,
        status: payment.status,
        amount: gross,
        net_amount: netAmount,
        platform_fee: platformFee,
      },
    };
  }

  async capture(merchantId: string, intentId: string) {
    const intent = await this.prisma.paymentIntent.findFirst({
      where: { id: intentId, merchantId },
      include: { payment: true },
    });
    if (!intent?.payment) throw new NotFoundException('Payment not found for intent');

    const provider = this.getProvider(intent.provider);
    const result = await provider.capture(intent.payment.providerRef || '');

    const payment = await this.prisma.payment.update({
      where: { id: intent.payment.id },
      data: {
        status: result.status,
        providerRef: result.providerRef,
        capturedAt: new Date(),
      },
    });

    await this.prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: PaymentStatus.SUCCEEDED },
    });

    await this.ledger.recordPaymentCapture(
      merchantId,
      payment.id,
      decimalToNumber(payment.grossAmount),
      decimalToNumber(payment.netAmount),
      decimalToNumber(payment.platformFee),
      payment.currency,
    );

    await this.webhooks.emitEvent(merchantId, 'payment.succeeded', {
      payment_id: payment.id,
      intent_id: intent.id,
      amount: decimalToNumber(payment.amount),
      status: result.status,
    });

    await this.events.logEvent('payments', {
      type: 'payment.captured',
      merchantId,
      entityId: payment.id,
      payload: { intentId: intent.id },
    });

    return {
      intent: this.serializeIntent({ ...intent, status: PaymentStatus.SUCCEEDED }),
      payment: {
        id: payment.id,
        status: payment.status,
        amount: decimalToNumber(payment.amount),
        net_amount: decimalToNumber(payment.netAmount),
        platform_fee: decimalToNumber(payment.platformFee),
      },
    };
  }

  async refund(merchantId: string, paymentId: string, amount?: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, merchantId },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const refundAmount = amount ?? decimalToNumber(payment.amount);
    const provider = this.getProvider(payment.provider);
    const result = await provider.refund(payment.providerRef || '', refundAmount);

    const refund = await this.prisma.refund.create({
      data: {
        paymentId: payment.id,
        amount: toDecimal(refundAmount),
        currency: payment.currency,
        status: result.status,
        providerRef: result.providerRef,
      },
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.REFUNDED },
    });

    await this.webhooks.emitEvent(merchantId, 'payment.refunded', {
      payment_id: payment.id,
      refund_id: refund.id,
      amount: refundAmount,
    });

    return { refund_id: refund.id, status: result.status, amount: refundAmount };
  }

  async createPaymentLink(merchantId: string, amount?: number, currency = 'GEL') {
    const code = randomBytes(8).toString('base64url');
    const link = await this.prisma.paymentLink.create({
      data: {
        merchantId,
        code,
        amount: amount != null ? toDecimal(amount) : null,
        currency,
      },
    });
    return {
      id: link.id,
      code: link.code,
      url: `/pay/${link.code}`,
      amount: link.amount ? decimalToNumber(link.amount) : null,
      currency: link.currency,
      active: link.active,
    };
  }

  async createCheckoutSession(
    merchantId: string,
    dto: CreateCheckoutSessionDto,
    idempotencyKey?: string,
    ip?: string,
  ) {
    const successUrl = dto.success_url || dto.successUrl;
    if (!successUrl) throw new BadRequestException('success_url is required');

    const key = idempotencyKey || dto.idempotency_key;
    if (key) {
      const existing = await this.prisma.legacyCheckoutSession.findUnique({
        where: { merchantId_idempotencyKey: { merchantId, idempotencyKey: key } },
      });
      if (existing) return this.serializeCheckout(existing);
    }

    const intentDto: CreateIntentDto = {
      amount: dto.amount,
      currency: dto.currency,
      successUrl,
      cancelUrl: dto.cancel_url || dto.cancelUrl,
      clientReferenceId: dto.client_reference_id || dto.clientReferenceId,
      metadata: dto.metadata,
    };

    const intent = await this.createIntent(merchantId, intentDto, key, ip);
    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MS);
    const merchant = await this.prisma.merchant.findUniqueOrThrow({ where: { id: merchantId } });
    const provider = dto.provider || merchant.defaultProvider;

    const checkoutUrl =
      dto.success_url?.includes('?') || successUrl.includes('?')
        ? `${successUrl}&intent=${intent.id}`
        : `${successUrl}?intent=${intent.id}`;

    const session = await this.prisma.legacyCheckoutSession.create({
      data: {
        merchantId,
        intentId: intent.id,
        amount: toDecimal(dto.amount),
        currency: dto.currency || 'GEL',
        provider,
        status: 'open',
        redirectUrl: checkoutUrl,
        successUrl,
        cancelUrl: dto.cancel_url || dto.cancelUrl,
        clientReferenceId: dto.client_reference_id || dto.clientReferenceId,
        idempotencyKey: key,
        expiresAt,
      },
    });

    return this.serializeCheckout(session);
  }

  private serializeCheckout(session: {
    id: string;
    intentId: string | null;
    amount: Prisma.Decimal;
    currency: string;
    status: string;
    provider: string;
    redirectUrl: string | null;
    successUrl: string;
    cancelUrl: string | null;
    clientReferenceId: string | null;
    expiresAt: Date;
    createdAt: Date;
  }) {
    return {
      id: session.id,
      object: 'checkout.session' as const,
      mode: 'payment' as const,
      status: session.status,
      amount: decimalToNumber(session.amount),
      currency: session.currency,
      provider: session.provider,
      success_url: session.successUrl,
      cancel_url: session.cancelUrl,
      client_reference_id: session.clientReferenceId,
      url: session.redirectUrl,
      intent_id: session.intentId,
      expires_at: Math.floor(session.expiresAt.getTime() / 1000),
      created: Math.floor(session.createdAt.getTime() / 1000),
    };
  }
}
