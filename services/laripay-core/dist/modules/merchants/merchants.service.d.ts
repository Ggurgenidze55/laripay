import { PrismaService } from '../../prisma/prisma.service';
import { OnboardMerchantDto } from './dto/onboard-merchant.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
export declare class MerchantsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    onboardMerchant(userId: string, dto: OnboardMerchantDto): Promise<{
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
    createApiKey(merchantId: string, dto: CreateApiKeyDto): Promise<{
        id: string;
        key: string;
        mode: string;
        prefix: string;
        createdAt: Date;
        warning: string;
    }>;
    getMerchant(merchantId: string): Promise<{
        apiKeys: {
            id: string;
            createdAt: Date;
            name: string | null;
            mode: string;
            keyPrefix: string;
            lastUsedAt: Date | null;
        }[];
    } & {
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
}
