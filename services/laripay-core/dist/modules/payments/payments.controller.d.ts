import { RequestWithAuth } from '../../common/types/request.types';
import { PaymentsService } from './payments.service';
import { CreateIntentDto } from './dto/create-intent.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
export declare class PaymentsController {
    private readonly payments;
    constructor(payments: PaymentsService);
    createIntent(req: RequestWithAuth, dto: CreateIntentDto, idempotencyKey?: string): Promise<{
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
    }>;
    getIntent(req: RequestWithAuth, id: string): Promise<{
        payment: {
            id: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            amount: number;
            net_amount: number;
            platform_fee: number;
        } | null;
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
    }>;
    authorize(req: RequestWithAuth, id: string): Promise<{
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
    }>;
    capture(req: RequestWithAuth, id: string): Promise<{
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
    }>;
    refund(req: RequestWithAuth, id: string, body: {
        amount?: number;
    }): Promise<{
        refund_id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        amount: number;
    }>;
    createLink(req: RequestWithAuth, body: {
        amount?: number;
        currency?: string;
    }): Promise<{
        id: string;
        code: string;
        url: string;
        amount: number | null;
        currency: string;
        active: boolean;
    }>;
    checkoutSession(req: RequestWithAuth, dto: CreateCheckoutSessionDto, idempotencyKey?: string): Promise<{
        id: string;
        object: "checkout.session";
        mode: "payment";
        status: string;
        amount: number;
        currency: string;
        provider: string;
        success_url: string;
        cancel_url: string | null;
        client_reference_id: string | null;
        url: string | null;
        intent_id: string | null;
        expires_at: number;
        created: number;
    }>;
}
