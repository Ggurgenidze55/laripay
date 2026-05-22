import { LedgerAccountType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export interface LedgerPostingLine {
    accountType: LedgerAccountType;
    debit?: number;
    credit?: number;
    description?: string;
}
export interface PostTransactionInput {
    merchantId: string;
    currency?: string;
    referenceType?: string;
    referenceId?: string;
    lines: LedgerPostingLine[];
}
export declare class LedgerService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    postTransaction(input: PostTransactionInput): Promise<{
        transactionId: string;
        entries: number;
    }>;
    getMerchantBalances(merchantId: string, currency?: string): Promise<{
        available: number;
        pending: number;
        payoutReserve: number;
    }>;
    getMerchantBalance(merchantId: string, currency?: string): Promise<{
        accountId: string;
        type: import(".prisma/client").$Enums.LedgerAccountType;
        currency: string;
        balance: number;
    }[]>;
    ensureMerchantAccounts(merchantId: string, currency?: string): Promise<void>;
    recordPaymentCapture(merchantId: string, paymentId: string, grossAmount: number, netAmount: number, platformFee: number, currency?: string): Promise<{
        transactionId: string;
        entries: number;
    }>;
}
