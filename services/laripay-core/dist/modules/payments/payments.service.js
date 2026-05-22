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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const crypto_2 = require("../../common/crypto");
const decimal_util_1 = require("../../common/utils/decimal.util");
const fraud_service_1 = require("../fraud/fraud.service");
const ledger_service_1 = require("../ledger/ledger.service");
const webhooks_service_1 = require("../webhooks/webhooks.service");
const events_service_1 = require("../events/events.service");
const mock_provider_1 = require("./providers/mock.provider");
const CHECKOUT_TTL_MS = 30 * 60 * 1000;
let PaymentsService = class PaymentsService {
    constructor(prisma, fraud, ledger, webhooks, events, mockProvider, config) {
        this.prisma = prisma;
        this.fraud = fraud;
        this.ledger = ledger;
        this.webhooks = webhooks;
        this.events = events;
        this.mockProvider = mockProvider;
        this.providers = new Map([[mockProvider.name, mockProvider]]);
        void config;
    }
    getProvider(name) {
        const provider = this.providers.get(name);
        if (!provider)
            throw new common_1.BadRequestException(`Unknown provider: ${name}`);
        return provider;
    }
    serializeIntent(intent) {
        return {
            id: intent.id,
            object: 'payment_intent',
            amount: (0, decimal_util_1.decimalToNumber)(intent.amount),
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
    async createIntent(merchantId, dto, idempotencyKey, ip) {
        if (idempotencyKey) {
            const existing = await this.prisma.paymentIntent.findUnique({
                where: { merchantId_idempotencyKey: { merchantId, idempotencyKey } },
            });
            if (existing)
                return this.serializeIntent(existing);
        }
        const merchant = await this.prisma.merchant.findUniqueOrThrow({ where: { id: merchantId } });
        const fraudResult = await this.fraud.scoreTransaction({
            merchantId,
            amount: dto.amount,
            currency: dto.currency || 'GEL',
            ipAddress: ip,
        });
        if (fraudResult.decision === 'block') {
            throw new common_1.ForbiddenException('Transaction blocked by fraud rules');
        }
        const intent = await this.prisma.paymentIntent.create({
            data: {
                merchantId,
                amount: (0, decimal_util_1.toDecimal)(dto.amount),
                currency: dto.currency || 'GEL',
                provider: merchant.defaultProvider,
                captureMethod: dto.captureMethod || 'automatic',
                clientSecret: (0, crypto_2.generateClientSecret)(),
                idempotencyKey,
                clientReferenceId: dto.clientReferenceId,
                successUrl: dto.successUrl,
                cancelUrl: dto.cancelUrl,
                metadata: dto.metadata,
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
    async getIntent(merchantId, intentId) {
        const intent = await this.prisma.paymentIntent.findFirst({
            where: { id: intentId, merchantId },
            include: { payment: true },
        });
        if (!intent)
            throw new common_1.NotFoundException('Payment intent not found');
        return {
            ...this.serializeIntent(intent),
            payment: intent.payment
                ? {
                    id: intent.payment.id,
                    status: intent.payment.status,
                    amount: (0, decimal_util_1.decimalToNumber)(intent.payment.amount),
                    net_amount: (0, decimal_util_1.decimalToNumber)(intent.payment.netAmount),
                    platform_fee: (0, decimal_util_1.decimalToNumber)(intent.payment.platformFee),
                }
                : null,
        };
    }
    async authorize(merchantId, intentId, ip) {
        const intent = await this.prisma.paymentIntent.findFirst({
            where: { id: intentId, merchantId },
            include: { payment: true },
        });
        if (!intent)
            throw new common_1.NotFoundException('Payment intent not found');
        if (intent.payment)
            return { intent: this.serializeIntent(intent), payment: intent.payment };
        const fraudResult = await this.fraud.scoreTransaction({
            merchantId,
            amount: (0, decimal_util_1.decimalToNumber)(intent.amount),
            currency: intent.currency,
            ipAddress: ip,
            paymentId: undefined,
        });
        if (fraudResult.decision === 'block') {
            throw new common_1.ForbiddenException('Transaction blocked by fraud rules');
        }
        const provider = this.getProvider(intent.provider);
        const auth = await provider.authorize({
            intentId: intent.id,
            amount: (0, decimal_util_1.decimalToNumber)(intent.amount),
            currency: intent.currency,
        });
        const merchant = await this.prisma.merchant.findUniqueOrThrow({ where: { id: merchantId } });
        const gross = (0, decimal_util_1.decimalToNumber)(intent.amount);
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
                grossAmount: (0, decimal_util_1.toDecimal)(gross),
                platformFee: (0, decimal_util_1.toDecimal)(platformFee),
                netAmount: (0, decimal_util_1.toDecimal)(netAmount),
                authorizedAt: new Date(),
            },
        });
        await this.prisma.paymentIntent.update({
            where: { id: intent.id },
            data: { status: client_1.PaymentStatus.AUTHORIZED, riskScore: fraudResult.score },
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
            intent: this.serializeIntent({ ...intent, status: client_1.PaymentStatus.AUTHORIZED }),
            payment: {
                id: payment.id,
                status: payment.status,
                amount: gross,
                net_amount: netAmount,
                platform_fee: platformFee,
            },
        };
    }
    async capture(merchantId, intentId) {
        const intent = await this.prisma.paymentIntent.findFirst({
            where: { id: intentId, merchantId },
            include: { payment: true },
        });
        if (!intent?.payment)
            throw new common_1.NotFoundException('Payment not found for intent');
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
            data: { status: client_1.PaymentStatus.SUCCEEDED },
        });
        await this.ledger.recordPaymentCapture(merchantId, payment.id, (0, decimal_util_1.decimalToNumber)(payment.grossAmount), (0, decimal_util_1.decimalToNumber)(payment.netAmount), (0, decimal_util_1.decimalToNumber)(payment.platformFee), payment.currency);
        await this.webhooks.emitEvent(merchantId, 'payment.succeeded', {
            payment_id: payment.id,
            intent_id: intent.id,
            amount: (0, decimal_util_1.decimalToNumber)(payment.amount),
            status: result.status,
        });
        await this.events.logEvent('payments', {
            type: 'payment.captured',
            merchantId,
            entityId: payment.id,
            payload: { intentId: intent.id },
        });
        return {
            intent: this.serializeIntent({ ...intent, status: client_1.PaymentStatus.SUCCEEDED }),
            payment: {
                id: payment.id,
                status: payment.status,
                amount: (0, decimal_util_1.decimalToNumber)(payment.amount),
                net_amount: (0, decimal_util_1.decimalToNumber)(payment.netAmount),
                platform_fee: (0, decimal_util_1.decimalToNumber)(payment.platformFee),
            },
        };
    }
    async refund(merchantId, paymentId, amount) {
        const payment = await this.prisma.payment.findFirst({
            where: { id: paymentId, merchantId },
        });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        const refundAmount = amount ?? (0, decimal_util_1.decimalToNumber)(payment.amount);
        const provider = this.getProvider(payment.provider);
        const result = await provider.refund(payment.providerRef || '', refundAmount);
        const refund = await this.prisma.refund.create({
            data: {
                paymentId: payment.id,
                amount: (0, decimal_util_1.toDecimal)(refundAmount),
                currency: payment.currency,
                status: result.status,
                providerRef: result.providerRef,
            },
        });
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: client_1.PaymentStatus.REFUNDED },
        });
        await this.webhooks.emitEvent(merchantId, 'payment.refunded', {
            payment_id: payment.id,
            refund_id: refund.id,
            amount: refundAmount,
        });
        return { refund_id: refund.id, status: result.status, amount: refundAmount };
    }
    async createPaymentLink(merchantId, amount, currency = 'GEL') {
        const code = (0, crypto_1.randomBytes)(8).toString('base64url');
        const link = await this.prisma.paymentLink.create({
            data: {
                merchantId,
                code,
                amount: amount != null ? (0, decimal_util_1.toDecimal)(amount) : null,
                currency,
            },
        });
        return {
            id: link.id,
            code: link.code,
            url: `/pay/${link.code}`,
            amount: link.amount ? (0, decimal_util_1.decimalToNumber)(link.amount) : null,
            currency: link.currency,
            active: link.active,
        };
    }
    async createCheckoutSession(merchantId, dto, idempotencyKey, ip) {
        const successUrl = dto.success_url || dto.successUrl;
        if (!successUrl)
            throw new common_1.BadRequestException('success_url is required');
        const key = idempotencyKey || dto.idempotency_key;
        if (key) {
            const existing = await this.prisma.legacyCheckoutSession.findUnique({
                where: { merchantId_idempotencyKey: { merchantId, idempotencyKey: key } },
            });
            if (existing)
                return this.serializeCheckout(existing);
        }
        const intentDto = {
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
        const checkoutUrl = dto.success_url?.includes('?') || successUrl.includes('?')
            ? `${successUrl}&intent=${intent.id}`
            : `${successUrl}?intent=${intent.id}`;
        const session = await this.prisma.legacyCheckoutSession.create({
            data: {
                merchantId,
                intentId: intent.id,
                amount: (0, decimal_util_1.toDecimal)(dto.amount),
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
    serializeCheckout(session) {
        return {
            id: session.id,
            object: 'checkout.session',
            mode: 'payment',
            status: session.status,
            amount: (0, decimal_util_1.decimalToNumber)(session.amount),
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
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        fraud_service_1.FraudService,
        ledger_service_1.LedgerService,
        webhooks_service_1.WebhooksService,
        events_service_1.EventsService,
        mock_provider_1.MockProvider,
        config_1.ConfigService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map