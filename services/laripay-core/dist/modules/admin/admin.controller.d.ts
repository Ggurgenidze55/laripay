import { Request } from 'express';
import { JwtPayload } from '../../common/types/request.types';
import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly admin;
    constructor(admin: AdminService);
    listMerchants(): Promise<{
        id: string;
        name: string;
        email: string;
        slug: string;
        status: import(".prisma/client").$Enums.MerchantStatus;
        kyc_status: import(".prisma/client").$Enums.KycStatus;
        created_at: Date;
    }[]>;
    approve(req: Request & {
        user: JwtPayload & {
            userId: string;
        };
    }, id: string): Promise<{
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
    listPayments(): Promise<{
        id: string;
        merchant_id: string;
        merchant_name: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        amount: number;
        currency: string;
        provider: string;
        created_at: Date;
    }[]>;
    auditLogs(): Promise<{
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
    disputes(): Promise<{
        id: string;
        payment_id: string;
        status: string;
        amount: number;
        merchant: string;
        created_at: Date;
    }[]>;
    fraud(): Promise<{
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
