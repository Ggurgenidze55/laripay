import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { FraudService } from '../fraud/fraud.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { RedirectCheckoutDto } from './dto/redirect-checkout.dto';
import { EmbeddedCheckoutDto } from './dto/embedded-checkout.dto';
import { DirectPaymentDto } from './dto/direct-payment.dto';
export declare class CheckoutService {
    private readonly prisma;
    private readonly payments;
    private readonly fraud;
    private readonly webhooks;
    private readonly config;
    constructor(prisma: PrismaService, payments: PaymentsService, fraud: FraudService, webhooks: WebhooksService, config: ConfigService);
    private checkoutBase;
    private serializeOrder;
    createOrder(merchantId: string, dto: CreateOrderDto, ip?: string): Promise<{
        id: string;
        object: string;
        amount: number;
        currency: string;
        status: string;
        checkout_mode: string;
        payment_intent_id: string | null;
        client_reference_id: string | null;
        locale: string;
        methods: string[];
        metadata: Prisma.JsonValue;
        expires_at: number | null;
        created: number;
    }>;
    createRedirectCheckout(merchantId: string, dto: RedirectCheckoutDto, ip?: string): Promise<{
        order: {
            id: string;
            object: string;
            amount: number;
            currency: string;
            status: string;
            checkout_mode: string;
            payment_intent_id: string | null;
            client_reference_id: string | null;
            locale: string;
            methods: string[];
            metadata: Prisma.JsonValue;
            expires_at: number | null;
            created: number;
        };
        checkout_url: string;
        payment_token: string;
        intent_id: string;
        session_id: string;
    }>;
    createEmbeddedSession(merchantId: string, dto: EmbeddedCheckoutDto): Promise<{
        order: {
            id: string;
            object: string;
            amount: number;
            currency: string;
            status: string;
            checkout_mode: string;
            payment_intent_id: string | null;
            client_reference_id: string | null;
            locale: string;
            methods: string[];
            metadata: Prisma.JsonValue;
            expires_at: number | null;
            created: number;
        };
        embedded_session_id: string;
        session_token: string;
        client_secret: string;
        sdk: {
            script: string;
            stylesheet: string;
        };
        config: {
            options: Record<string, unknown>;
            params: Record<string, unknown>;
            theme: Record<string, unknown>;
            messages: Record<string, unknown>;
            fields_custom: Record<string, unknown>;
            css_variable: Record<string, unknown>;
            methods: string[];
        };
    }>;
    getEmbeddedConfig(sessionToken: string): Promise<{
        session_token: string;
        order_id: string;
        amount: number;
        currency: string;
        methods: string[];
        options: Prisma.JsonValue;
        params: Prisma.JsonValue;
        theme: Prisma.JsonValue;
        messages: Prisma.JsonValue;
        fields_custom: Prisma.JsonValue;
        css_variable: Prisma.JsonValue;
        branding: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            merchantId: string;
            theme: string;
            logoUrl: string | null;
            primaryColor: string | null;
            accentColor: string | null;
            layout: string;
            methodOrder: string[];
            gradient: string | null;
            fullscreen: boolean;
            compact: boolean;
            locales: string[];
            customCss: Prisma.JsonValue | null;
        } | null;
    }>;
    processDirectPayment(merchantId: string, dto: DirectPaymentDto, ip?: string): Promise<{
        order_id: string;
        intent_id: string;
        status: string;
        requires_3ds: boolean;
        three_ds_url: string | null;
        payment_token: string | undefined;
        result: {
            intent: {
                id: string;
                object: string;
                amount: number;
                currency: string;
                status: import(".prisma/client").$Enums.PaymentStatus;
                client_secret: string;
                client_reference_id: string | null;
                metadata: Prisma.JsonValue;
                risk_score: number | null;
                created: number;
                updated: number;
            };
            payment: {
                id: string;
                status: import(".prisma/client").$Enums.PaymentStatus;
                amount: number;
                net_amount: number;
                platform_fee: number;
            };
        } | {
            intent: {
                id: string;
                object: string;
                amount: number;
                currency: string;
                status: import(".prisma/client").$Enums.PaymentStatus;
                client_secret: string;
                client_reference_id: string | null;
                metadata: Prisma.JsonValue;
                risk_score: number | null;
                created: number;
                updated: number;
            };
            payment: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                metadata: Prisma.JsonValue | null;
                merchantId: string;
                status: import(".prisma/client").$Enums.PaymentStatus;
                currency: string;
                providerRef: string | null;
                amount: Prisma.Decimal;
                provider: string;
                intentId: string;
                grossAmount: Prisma.Decimal;
                platformFee: Prisma.Decimal;
                netAmount: Prisma.Decimal;
                authorizedAt: Date | null;
                capturedAt: Date | null;
                failedAt: Date | null;
                failureCode: string | null;
                failureMessage: string | null;
            };
        };
        events: {
            onPaymentSuccess: string;
            onPaymentFailed: string;
            on3DSRedirect: string;
        };
    }>;
    getHostedCheckoutPage(sessionId: string): Promise<string>;
    private buildHostedHtml;
    completeHostedPayment(sessionId: string): Promise<{
        redirect: string;
        payment: {
            intent: {
                id: string;
                object: string;
                amount: number;
                currency: string;
                status: import(".prisma/client").$Enums.PaymentStatus;
                client_secret: string;
                client_reference_id: string | null;
                metadata: Prisma.JsonValue;
                risk_score: number | null;
                created: number;
                updated: number;
            };
            payment: {
                id: string;
                status: import(".prisma/client").$Enums.PaymentStatus;
                amount: number;
                net_amount: number;
                platform_fee: number;
            };
        };
    }>;
}
