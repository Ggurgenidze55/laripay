import { Response } from 'express';
import { RequestWithAuth } from '../../common/types/request.types';
import { CheckoutService } from './checkout.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { RedirectCheckoutDto } from './dto/redirect-checkout.dto';
import { EmbeddedCheckoutDto } from './dto/embedded-checkout.dto';
import { DirectPaymentDto } from './dto/direct-payment.dto';
export declare class CheckoutController {
    private readonly checkout;
    constructor(checkout: CheckoutService);
    createOrder(req: RequestWithAuth, dto: CreateOrderDto): Promise<{
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
        metadata: import("@prisma/client/runtime/library").JsonValue;
        expires_at: number | null;
        created: number;
    }>;
    redirect(req: RequestWithAuth, dto: RedirectCheckoutDto): Promise<{
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
            metadata: import("@prisma/client/runtime/library").JsonValue;
            expires_at: number | null;
            created: number;
        };
        checkout_url: string;
        payment_token: string;
        intent_id: string;
        session_id: string;
    }>;
    embedded(req: RequestWithAuth, dto: EmbeddedCheckoutDto): Promise<{
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
            metadata: import("@prisma/client/runtime/library").JsonValue;
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
    embeddedConfig(token: string): Promise<{
        session_token: string;
        order_id: string;
        amount: number;
        currency: string;
        methods: string[];
        options: import("@prisma/client/runtime/library").JsonValue;
        params: import("@prisma/client/runtime/library").JsonValue;
        theme: import("@prisma/client/runtime/library").JsonValue;
        messages: import("@prisma/client/runtime/library").JsonValue;
        fields_custom: import("@prisma/client/runtime/library").JsonValue;
        css_variable: import("@prisma/client/runtime/library").JsonValue;
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
            customCss: import("@prisma/client/runtime/library").JsonValue | null;
        } | null;
    }>;
    direct(req: RequestWithAuth, dto: DirectPaymentDto): Promise<{
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
                metadata: import("@prisma/client/runtime/library").JsonValue;
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
                metadata: import("@prisma/client/runtime/library").JsonValue;
                risk_score: number | null;
                created: number;
                updated: number;
            };
            payment: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                merchantId: string;
                status: import(".prisma/client").$Enums.PaymentStatus;
                currency: string;
                providerRef: string | null;
                amount: import("@prisma/client/runtime/library").Decimal;
                provider: string;
                intentId: string;
                grossAmount: import("@prisma/client/runtime/library").Decimal;
                platformFee: import("@prisma/client/runtime/library").Decimal;
                netAmount: import("@prisma/client/runtime/library").Decimal;
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
    hostedPage(sessionId: string, res: Response): Promise<void>;
    hostedPay(sessionId: string, res: Response): Promise<void>;
    threeDs(intentId: string, res: Response): void;
}
