"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const decimal_util_1 = require("../../common/utils/decimal.util");
const api_status_util_1 = require("../../common/utils/api-status.util");
const payments_service_1 = require("../payments/payments.service");
const fraud_service_1 = require("../fraud/fraud.service");
const webhooks_service_1 = require("../webhooks/webhooks.service");
const ORDER_TTL_MS = 30 * 60 * 1000;
let CheckoutService = class CheckoutService {
    constructor(prisma, payments, fraud, webhooks, config) {
        this.prisma = prisma;
        this.payments = payments;
        this.fraud = fraud;
        this.webhooks = webhooks;
        this.config = config;
    }
    checkoutBase() {
        return this.config.get('checkoutBaseUrl') || 'http://localhost:4000';
    }
    serializeOrder(order) {
        return {
            id: order.id,
            object: 'order',
            amount: (0, decimal_util_1.decimalToNumber)(order.amount),
            currency: order.currency,
            status: (0, api_status_util_1.mapOrderStatus)(order.status),
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
    async createOrder(merchantId, dto, ip) {
        const fraud = await this.fraud.scoreTransaction({
            merchantId,
            amount: dto.amount,
            currency: dto.currency || 'GEL',
            ipAddress: ip,
        });
        if (fraud.decision === 'block') {
            throw new common_1.BadRequestException('Order blocked by fraud engine');
        }
        const order = await this.prisma.order.create({
            data: {
                merchantId,
                amount: (0, decimal_util_1.toDecimal)(dto.amount),
                currency: dto.currency || 'GEL',
                clientReferenceId: dto.client_reference_id,
                description: dto.description,
                locale: dto.locale || 'en',
                methods: dto.methods || ['card', 'wallets', 'banks'],
                metadata: dto.metadata,
                expiresAt: new Date(Date.now() + ORDER_TTL_MS),
            },
        });
        await this.webhooks.emitEvent(merchantId, 'order.created', {
            order_id: order.id,
            amount: dto.amount,
        });
        return this.serializeOrder(order);
    }
    async createRedirectCheckout(merchantId, dto, ip) {
        const orderRow = await this.prisma.order.create({
            data: {
                merchantId,
                amount: (0, decimal_util_1.toDecimal)(dto.amount),
                currency: dto.currency || 'GEL',
                checkoutMode: client_1.CheckoutMode.REDIRECT,
                clientReferenceId: dto.client_reference_id,
                description: dto.description,
                locale: dto.locale || 'en',
                methods: dto.methods || ['card', 'wallets', 'banks'],
                metadata: dto.metadata,
                expiresAt: new Date(Date.now() + ORDER_TTL_MS),
            },
        });
        const intent = await this.payments.createIntent(merchantId, {
            amount: dto.amount,
            currency: dto.currency,
            successUrl: dto.success_url,
            cancelUrl: dto.cancel_url,
            clientReferenceId: dto.client_reference_id,
            metadata: { order_id: orderRow.id, ...(dto.metadata || {}) },
        }, undefined, ip);
        await this.prisma.order.update({
            where: { id: orderRow.id },
            data: { paymentIntentId: intent.id, status: client_1.OrderStatus.PROCESSING },
        });
        const session = await this.prisma.legacyCheckoutSession.create({
            data: {
                merchantId,
                intentId: intent.id,
                amount: (0, decimal_util_1.toDecimal)(dto.amount),
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
                    customCss: dto.branding,
                },
                update: { customCss: dto.branding },
            });
        }
        return {
            order: this.serializeOrder({
                ...orderRow,
                paymentIntentId: intent.id,
                status: client_1.OrderStatus.PROCESSING,
            }),
            checkout_url: checkoutUrl,
            payment_token: intent.client_secret,
            intent_id: intent.id,
            session_id: session.id,
        };
    }
    async createEmbeddedSession(merchantId, dto) {
        const order = await this.prisma.order.create({
            data: {
                merchantId,
                amount: (0, decimal_util_1.toDecimal)(dto.amount),
                currency: dto.currency || 'GEL',
                checkoutMode: client_1.CheckoutMode.EMBEDDED,
                clientReferenceId: dto.client_reference_id,
                locale: dto.locale || 'en',
                methods: dto.methods || ['card', 'wallets', 'banks'],
                metadata: dto.metadata,
                expiresAt: new Date(Date.now() + ORDER_TTL_MS),
            },
        });
        const sessionToken = `emb_${(0, crypto_1.randomBytes)(18).toString('base64url')}`;
        const embedded = await this.prisma.embeddedCheckoutSession.create({
            data: {
                merchantId,
                orderId: order.id,
                sessionToken,
                options: dto.options,
                params: dto.params,
                theme: dto.theme,
                messages: dto.messages,
                fieldsCustom: dto.fields_custom,
                cssVariables: dto.css_variable,
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
            data: { paymentIntentId: intent.id, status: client_1.OrderStatus.PROCESSING },
        });
        return {
            order: this.serializeOrder({
                ...order,
                paymentIntentId: intent.id,
                status: client_1.OrderStatus.PROCESSING,
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
    async getEmbeddedConfig(sessionToken) {
        const session = await this.prisma.embeddedCheckoutSession.findUnique({
            where: { sessionToken },
            include: { order: true, merchant: { include: { checkoutBranding: true } } },
        });
        if (!session)
            throw new common_1.NotFoundException('Embedded session not found');
        if (session.expiresAt < new Date())
            throw new common_1.BadRequestException('Session expired');
        return {
            session_token: sessionToken,
            order_id: session.orderId,
            amount: (0, decimal_util_1.decimalToNumber)(session.order.amount),
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
    async processDirectPayment(merchantId, dto, ip) {
        const order = await this.prisma.order.findFirst({
            where: { id: dto.order_id, merchantId },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const fraud = await this.fraud.scoreTransaction({
            merchantId,
            amount: dto.amount ?? (0, decimal_util_1.decimalToNumber)(order.amount),
            currency: order.currency,
            ipAddress: ip,
        });
        if (fraud.decision === 'block') {
            throw new common_1.BadRequestException('Payment blocked by fraud engine');
        }
        let intentId = order.paymentIntentId;
        if (!intentId) {
            const intent = await this.payments.createIntent(merchantId, {
                amount: (0, decimal_util_1.decimalToNumber)(order.amount),
                currency: order.currency,
                metadata: { order_id: order.id, direct: true },
            });
            intentId = intent.id;
            await this.prisma.order.update({
                where: { id: order.id },
                data: { paymentIntentId: intentId, checkoutMode: client_1.CheckoutMode.DIRECT },
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
    getHostedCheckoutPage(sessionId) {
        return this.buildHostedHtml(sessionId);
    }
    async buildHostedHtml(sessionId) {
        const session = await this.prisma.legacyCheckoutSession.findUnique({
            where: { id: sessionId },
        });
        if (!session)
            throw new common_1.NotFoundException('Checkout session not found');
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
<p>${(0, decimal_util_1.decimalToNumber)(session.amount).toFixed(2)} ${session.currency}</p>
<div class="method">💳 Card · Apple Pay · Google Pay</div>
<div class="method">🏦 Open Banking (TBC, BOG, Liberty, Credo)</div>
<form method="POST" action="${this.checkoutBase()}/api/v1/checkout/hosted/${sessionId}/pay">
<button class="btn" type="submit">Pay securely</button>
</form>
<p style="font-size:12px;opacity:.6">Sandbox · PCI-ready · 3DS supported</p>
</div></body></html>`;
    }
    async completeHostedPayment(sessionId) {
        const session = await this.prisma.legacyCheckoutSession.findUnique({
            where: { id: sessionId },
        });
        if (!session?.intentId)
            throw new common_1.NotFoundException('Session not found');
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
                data: { status: client_1.OrderStatus.APPROVED },
            });
        }
        return { redirect: session.successUrl, payment: captured };
    }
};
exports.CheckoutService = CheckoutService;
exports.CheckoutService = CheckoutService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        payments_service_1.PaymentsService,
        fraud_service_1.FraudService,
        webhooks_service_1.WebhooksService,
        config_1.ConfigService])
], CheckoutService);
//# sourceMappingURL=checkout.service.js.map