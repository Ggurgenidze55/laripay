import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export declare class QrService {
    private readonly prisma;
    private readonly config;
    constructor(prisma: PrismaService, config: ConfigService);
    create(merchantId: string, body: {
        amount: number;
        currency?: string;
        order_id?: string;
    }): Promise<{
        id: string;
        code: string;
        amount: number;
        currency: string;
        qr_url: string;
        status: string;
        expires_at: number;
    }>;
    resolve(code: string): Promise<{
        error: string;
        code?: undefined;
        amount?: undefined;
        currency?: undefined;
        status?: undefined;
        pay_url?: undefined;
    } | {
        code: string;
        amount: number;
        currency: string;
        status: string;
        pay_url: string | null;
        error?: undefined;
    }>;
}
