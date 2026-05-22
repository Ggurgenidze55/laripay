import { PrismaService } from '../../prisma/prisma.service';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listMerchants(): Promise<{
        id: string;
        name: string;
        email: string;
        slug: string;
        status: import(".prisma/client").$Enums.MerchantStatus;
        kyc_status: import(".prisma/client").$Enums.KycStatus;
        created_at: Date;
    }[]>;
    approveMerchant(merchantId: string, actorId: string): Promise<{
        email: string;
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        slug: string;
        status: import(".prisma/client").$Enums.MerchantStatus;
        kycStatus: import(".prisma/client").$Enums.KycStatus;
        billingMode: string;
        commissionRateBps: number;
        subscriptionActiveUntil: Date | null;
        webhookSecret: string;
        defaultProvider: string;
    }>;
    listPayments(limit?: number): Promise<{
        id: string;
        merchant_id: string;
        merchant_name: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        amount: number;
        currency: string;
        provider: string;
        created_at: Date;
    }[]>;
    listAuditLogs(limit?: number): Promise<{
        id: string;
        action: import(".prisma/client").$Enums.AuditAction;
        actor: {
            email: string;
            id: string;
        } | null;
        merchant: {
            id: string;
            name: string;
        } | null;
        entity_type: string | null;
        entity_id: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        created_at: Date;
    }[]>;
    listDisputes(limit?: number): Promise<{
        id: string;
        payment_id: string;
        status: string;
        amount: number;
        merchant: string;
        created_at: Date;
    }[]>;
    listFraudChecks(limit?: number): Promise<{
        id: string;
        createdAt: Date;
        ipAddress: string | null;
        merchantId: string | null;
        decision: string;
        score: number;
        country: string | null;
        deviceFp: string | null;
        rules: import("@prisma/client/runtime/library").JsonValue | null;
        paymentId: string | null;
    }[]>;
}
