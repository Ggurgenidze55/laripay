import { PrismaService } from '../../prisma/prisma.service';
export declare class TokensService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    tokenizeCard(merchantId: string, body: {
        encrypted_payload?: string;
        last4?: string;
        brand?: string;
        exp_month?: number;
        exp_year?: number;
        customer_id?: string;
    }): Promise<{
        id: string;
        object: string;
        token: string;
        last4: string | null;
        brand: string | null;
        exp_month: number | null;
        exp_year: number | null;
        usable_for: string[];
    }>;
}
