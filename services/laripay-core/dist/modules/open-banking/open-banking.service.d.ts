import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
export declare class OpenBankingService {
    private readonly prisma;
    private readonly payments;
    private readonly config;
    constructor(prisma: PrismaService, payments: PaymentsService, config: ConfigService);
    listBanks(): {
        object: string;
        data: {
            code: string;
            name: string;
            payment_system: string;
        }[];
    };
    createSession(merchantId: string, body: {
        amount: number;
        currency?: string;
        bank?: string;
        success_url?: string;
    }): Promise<{
        payment_token: string;
        payment_system: string;
        bank: string;
        intent_id: string;
        client_secret: string;
        sca_url: string;
        status: string;
        amount: number;
        currency: string;
    }>;
    getScaPage(token: string, bank: string): string;
    approveSca(token: string): Promise<{
        status: string;
        intent_id: string;
        amount: number;
        payment: {
            id: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            amount: number;
            net_amount: number;
            platform_fee: number;
        };
    }>;
}
