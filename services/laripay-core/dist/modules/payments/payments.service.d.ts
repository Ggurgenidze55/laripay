import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FraudService } from '../fraud/fraud.service';
import { LedgerService } from '../ledger/ledger.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { EventsService } from '../events/events.service';
import { MockProvider } from './providers/mock.provider';
import { CreateIntentDto } from './dto/create-intent.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
export declare class PaymentsService {
    private readonly prisma;
    private readonly fraud;
    private readonly ledger;
    private readonly webhooks;
    private readonly events;
    private readonly mockProvider;
    private readonly providers;
    constructor(prisma: PrismaService, fraud: FraudService, ledger: LedgerService, webhooks: WebhooksService, events: EventsService, mockProvider: MockProvider, config: ConfigService);
    private getProvider;
    private serializeIntent;
    createIntent(merchantId: string, dto: CreateIntentDto, idempotencyKey?: string, ip?: string): Promise<{
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
    }>;
    getIntent(merchantId: string, intentId: string): Promise<{
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
        metadata: Prisma.JsonValue;
        risk_score: number | null;
        created: number;
        updated: number;
    }>;
    authorize(merchantId: string, intentId: string, ip?: string): Promise<{
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
    }>;
    capture(merchantId: string, intentId: string): Promise<{
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
    }>;
    refund(merchantId: string, paymentId: string, amount?: number): Promise<{
        refund_id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        amount: number;
    }>;
    createPaymentLink(merchantId: string, amount?: number, currency?: string): Promise<{
        id: string;
        code: string;
        url: string;
        amount: number | null;
        currency: string;
        active: boolean;
    }>;
    createCheckoutSession(merchantId: string, dto: CreateCheckoutSessionDto, idempotencyKey?: string, ip?: string): Promise<{
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
    private serializeCheckout;
}
