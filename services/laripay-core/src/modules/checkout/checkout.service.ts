import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CheckoutMode, OrderStatus, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { decimalToNumber, toDecimal } from '../../common/utils/decimal.util';
import { mapOrderStatus } from '../../common/utils/api-status.util';
import { PaymentsService } from '../payments/payments.service';
import { FraudService } from '../fraud/fraud.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { RedirectCheckoutDto } from './dto/redirect-checkout.dto';
import { EmbeddedCheckoutDto } from './dto/embedded-checkout.dto';
import { DirectPaymentDto } from './dto/direct-payment.dto';

const ORDER_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    private readonly fraud: FraudService,
    private readonly webhooks: WebhooksService,
    private readonly config: ConfigService,
  ) {}

  private checkoutBase(): string {
    return this.config.get<string>('checkoutBaseUrl') || 'http://localhost:4000';
  }

  private serializeOrder(order: {
    id: string;
    amount: Prisma.Decimal;
    currency: string;
    status: OrderStatus;
    checkoutMode: CheckoutMode;
    paymentIntentId: string | null;
    clientReferenceId: string | null;
    locale: string;
    methods: string[];
    metadata: Prisma.JsonValue;
    expiresAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: order.id,
      object: 'order',
      amount: decimalToNumber(order.amount),
      currency: order.currency,
      status: mapOrderStatus(order.status),
      checkout_mode: order.checkoutMode.toLowerCase(),
      payment_intent_id: order.paymentIntentId,
      client_reference_id: order.clientReferenceId,
      locale: order.locale,
      methods: order.methods,
      metadata: order.metadata,
      expires_at: order.expiresAt ? Math.floor(order.expiresAt.getTime() / 1000) : null,
      created: Math.floor(order.createdAt.getTime() / 1000),
    };
  }

  async createOrder(merchantId: string, dto: CreateOrderDto, ip?: string) {
    const fraud = await this.fraud.scoreTransaction({
      merchantId,
      amount: dto.amount,
      currency: dto.currency || 'GEL',
      ipAddress: ip,
    });
    if (fraud.decision === 'block') {
      throw new BadRequestException('Order blocked by fraud engine');
    }

    const order = await this.prisma.order.create({
      data: {
        merchantId,
        amount: toDecimal(dto.amount),
        currency: dto.currency || 'GEL',
        clientReferenceId: dto.client_reference_id,
        description: dto.description,
        locale: dto.locale || 'en',
        methods: dto.methods || ['card', 'wallets', 'banks'],
        metadata: dto.metadata as Prisma.InputJsonValue,
        expiresAt: new Date(Date.now() + ORDER_TTL_MS),
      },
    });

    await this.webhooks.emitEvent(merchantId, 'order.created', {
      order_id: order.id,
      amount: dto.amount,
    });

    return this.serializeOrder(order);
  }

  async createRedirectCheckout(merchantId: string, dto: RedirectCheckoutDto, ip?: string) {
    const orderRow = await this.prisma.order.create({
      data: {
        merchantId,
        amount: toDecimal(dto.amount),
        currency: dto.currency || 'GEL',
        checkoutMode: CheckoutMode.REDIRECT,
        clientReferenceId: dto.client_reference_id,
        description: dto.description,
        locale: dto.locale || 'en',
        methods: dto.methods || ['card', 'wallets', 'banks'],
        metadata: dto.metadata as Prisma.InputJsonValue,
        expiresAt: new Date(Date.now() + ORDER_TTL_MS),
      },
    });

    const intent = await this.payments.createIntent(
      merchantId,
      {
        amount: dto.amount,
        currency: dto.currency,
        successUrl: dto.success_url,
        cancelUrl: dto.cancel_url,
        clientReferenceId: dto.client_reference_id,
        metadata: { order_id: orderRow.id, ...(dto.metadata || {}) },
      },
      undefined,
      ip,
    );

    await this.prisma.order.update({
      where: { id: orderRow.id },
      data: { paymentIntentId: intent.id, status: OrderStatus.PROCESSING },
    });

    const session = await this.prisma.legacyCheckoutSession.create({
      data: {
        merchantId,
        intentId: intent.id,
        amount: toDecimal(dto.amount),
        currency: dto.currency || 'GEL',
        provider: dto.provider || 'mock',
        status: 'open',
        redirectUrl: '',
        successUrl: dto.success_url,
        cancelUrl: dto.cancel_url,
        clientReferenceId: dto.client_reference_id,
        expiresAt: new Date(Date.now() + ORDER_TTL_MS),
      },
    });

    const checkoutUrl = `${this.checkoutBase()}/api/v1/checkout/hosted/${session.id}`;
    await this.prisma.legacyCheckoutSession.update({
      where: { id: session.id },
      data: { redirectUrl: checkoutUrl },
    });

    if (dto.branding) {
      await this.prisma.merchantCheckoutBranding.upsert({
        where: { merchantId },
        create: {
          merchantId,
          customCss: dto.branding as Prisma.InputJsonValue,
        },
        update: { customCss: dto.branding as Prisma.InputJsonValue },
      });
    }

    return {
      order: this.serializeOrder({
        ...orderRow,
        paymentIntentId: intent.id,
        status: OrderStatus.PROCESSING,
      }),
      checkout_url: checkoutUrl,
      payment_token: intent.client_secret,
      intent_id: intent.id,
      session_id: session.id,
    };
  }

  async createEmbeddedSession(merchantId: string, dto: EmbeddedCheckoutDto) {
    const order = await this.prisma.order.create({
      data: {
        merchantId,
        amount: toDecimal(dto.amount),
        currency: dto.currency || 'GEL',
        checkoutMode: CheckoutMode.EMBEDDED,
        clientReferenceId: dto.client_reference_id,
        locale: dto.locale || 'en',
        methods: dto.methods || ['card', 'wallets', 'banks'],
        metadata: dto.metadata as Prisma.InputJsonValue,
        expiresAt: new Date(Date.now() + ORDER_TTL_MS),
      },
    });

    const sessionToken = `emb_${randomBytes(18).toString('base64url')}`;
    const embedded = await this.prisma.embeddedCheckoutSession.create({
      data: {
        merchantId,
        orderId: order.id,
        sessionToken,
        options: dto.options as Prisma.InputJsonValue,
        params: dto.params as Prisma.InputJsonValue,
        theme: dto.theme as Prisma.InputJsonValue,
        messages: dto.messages as Prisma.InputJsonValue,
        fieldsCustom: dto.fields_custom as Prisma.InputJsonValue,
        cssVariables: dto.css_variable as Prisma.InputJsonValue,
        methods: dto.methods || ['card', 'wallets', 'banks'],
        expiresAt: new Date(Date.now() + ORDER_TTL_MS),
      },
    });

    const intent = await this.payments.createIntent(merchantId, {
      amount: dto.amount,
      currency: dto.currency,
      clientReferenceId: dto.client_reference_id,
      metadata: { order_id: order.id, embedded_session: embedded.id },
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentIntentId: intent.id, status: OrderStatus.PROCESSING },
    });

    return {
      order: this.serializeOrder({
        ...order,
        paymentIntentId: intent.id,
        status: OrderStatus.PROCESSING,
      }),
      embedded_session_id: embedded.id,
      session_token: sessionToken,
      client_secret: intent.client_secret,
      sdk: {
        script: `${this.checkoutBase()}/sdk/checkout.js`,
        stylesheet: `${this.checkoutBase()}/sdk/checkout.css`,
      },
      config: {
        options: dto.options || {},
        params: dto.params || {},
        theme: dto.theme || { preset: 'navy_shimmer', mode: 'dark' },
        messages: dto.messages || {},
        fields_custom: dto.fields_custom || {},
        css_variable: dto.css_variable || {},
        methods: embedded.methods,
      },
    };
  }

  async getEmbeddedConfig(sessionToken: string) {
    const session = await this.prisma.embeddedCheckoutSession.findUnique({
      where: { sessionToken },
      include: { order: true, merchant: { include: { checkoutBranding: true } } },
    });
    if (!session) throw new NotFoundException('Embedded session not found');
    if (session.expiresAt < new Date()) throw new BadRequestException('Session expired');

    return {
      session_token: sessionToken,
      order_id: session.orderId,
      amount: decimalToNumber(session.order.amount),
      currency: session.order.currency,
      methods: session.methods,
      options: session.options,
      params: session.params,
      theme: session.theme,
      messages: session.messages,
      fields_custom: session.fieldsCustom,
      css_variable: session.cssVariables,
      branding: session.merchant.checkoutBranding,
    };
  }

  async processDirectPayment(merchantId: string, dto: DirectPaymentDto, ip?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.order_id, merchantId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const fraud = await this.fraud.scoreTransaction({
      merchantId,
      amount: dto.amount ?? decimalToNumber(order.amount),
      currency: order.currency,
      ipAddress: ip,
    });
    if (fraud.decision === 'block') {
      throw new BadRequestException('Payment blocked by fraud engine');
    }

    let intentId = order.paymentIntentId;
    if (!intentId) {
      const intent = await this.payments.createIntent(merchantId, {
        amount: decimalToNumber(order.amount),
        currency: order.currency,
        metadata: { order_id: order.id, direct: true },
      });
      intentId = intent.id;
      await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentIntentId: intentId, checkoutMode: CheckoutMode.DIRECT },
      });
    }

    const auth = await this.payments.authorize(merchantId, intentId, ip);
    const requires3ds = true;
    const threeDsUrl = requires3ds
      ? `${this.checkoutBase()}/api/v1/checkout/3ds/${intentId}`
      : null;

    return {
      order_id: order.id,
      intent_id: intentId,
      status: 'processing',
      requires_3ds: requires3ds,
      three_ds_url: threeDsUrl,
      payment_token: dto.card_token || dto.wallet_token || dto.encrypted_payload,
      result: auth,
      events: {
        onPaymentSuccess: 'payment.succeeded',
        onPaymentFailed: 'payment.failed',
        on3DSRedirect: 'payment.3ds_required',
      },
    };
  }

  getHostedCheckoutPage(sessionId: string): Promise<string> {
    return this.buildHostedHtml(sessionId);
  }

  private async buildHostedHtml(sessionId: string): Promise<string> {
    const session = await this.prisma.legacyCheckoutSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Checkout session not found');

    const merchant = await this.prisma.merchant.findUnique({
      where: { id: session.merchantId },
      include: { checkoutBranding: true },
    });
    const branding = merchant?.checkoutBranding;
    const primary = branding?.primaryColor || '#3b82f6';
    const accent = branding?.accentColor || '#06b6d4';
    const theme = branding?.theme || 'dark';
    const bg = theme === 'light' ? '#f8fafc' : '#0a0a0f';
    const text = theme === 'light' ? '#0f172a' : '#f1f5f9';

    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>LariPay Checkout</title>
<style>
:root{--lp-primary:${primary};--lp-accent:${accent}}
body{margin:0;font-family:system-ui,sans-serif;background:${bg};color:${text};min-height:100vh;display:flex;align-items:center;justify-content:center}
.card{max-width:420px;width:100%;padding:2rem;border-radius:1rem;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04)}
.btn{display:block;width:100%;padding:14px;margin:8px 0;border:0;border-radius:10px;font-weight:600;cursor:pointer;background:linear-gradient(135deg,var(--lp-primary),var(--lp-accent));color:#fff}
.method{border:1px solid rgba(255,255,255,.15);padding:12px;border-radius:8px;margin:8px 0}
</style></head><body>
<div class="card">
<h1>LariPay</h1>
<p>${decimalToNumber(session.amount).toFixed(2)} ${session.currency}</p>
<div class="method">💳 Card · Apple Pay · Google Pay</div>
<div class="method">🏦 Open Banking (TBC, BOG, Liberty, Credo)</div>
<form method="POST" action="${this.checkoutBase()}/api/v1/checkout/hosted/${sessionId}/pay">
<button class="btn" type="submit">Pay securely</button>
</form>
<p style="font-size:12px;opacity:.6">Sandbox · PCI-ready · 3DS supported</p>
</div></body></html>`;
  }

  async completeHostedPayment(sessionId: string) {
    const session = await this.prisma.legacyCheckoutSession.findUnique({
      where: { id: sessionId },
    });
    if (!session?.intentId) throw new NotFoundException('Session not found');

    await this.payments.authorize(session.merchantId, session.intentId);
    const captured = await this.payments.capture(session.merchantId, session.intentId);

    await this.prisma.legacyCheckoutSession.update({
      where: { id: session.id },
      data: { status: 'complete' },
    });

    const order = await this.prisma.order.findFirst({
      where: { paymentIntentId: session.intentId },
    });
    if (order) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.APPROVED },
      });
    }

    return { redirect: session.successUrl, payment: captured };
  }
}
