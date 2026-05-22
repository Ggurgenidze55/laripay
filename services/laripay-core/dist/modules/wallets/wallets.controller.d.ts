import { RequestWithAuth } from '../../common/types/request.types';
import { LedgerService } from '../ledger/ledger.service';
import { PrismaService } from '../../prisma/prisma.service';
export declare class WalletsController {
    private readonly ledger;
    private readonly prisma;
    constructor(ledger: LedgerService, prisma: PrismaService);
    balance(req: RequestWithAuth): Promise<{
        object: string;
        currency: string;
        available: number;
        pending: number;
        payout_reserve: number;
    }>;
    ledgerEntries(req: RequestWithAuth): Promise<{
        object: string;
        accounts: {
            id: string;
            type: import(".prisma/client").$Enums.LedgerAccountType;
            currency: string;
            entries: {
                id: string;
                createdAt: Date;
                currency: string;
                transactionId: string;
                accountId: string;
                debit: import("@prisma/client/runtime/library").Decimal;
                credit: import("@prisma/client/runtime/library").Decimal;
                description: string | null;
                referenceType: string | null;
                referenceId: string | null;
                immutable: boolean;
            }[];
        }[];
    }>;
}
