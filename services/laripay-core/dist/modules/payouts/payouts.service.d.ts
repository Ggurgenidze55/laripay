import { PrismaService } from '../../prisma/prisma.service';
import { CreatePayoutDto } from './dto/create-payout.dto';
export declare class PayoutsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(merchantId: string, dto: CreatePayoutDto, actorId?: string): Promise<{
        id: string;
        amount: number;
        currency: string;
        status: import(".prisma/client").$Enums.PayoutStatus;
        bank_iban: string | null;
        scheduled_at: Date | null;
        created_at: Date;
    }>;
    list(merchantId: string): Promise<{
        id: string;
        amount: number;
        currency: string;
        status: import(".prisma/client").$Enums.PayoutStatus;
        bank_iban: string | null;
        scheduled_at: Date | null;
        created_at: Date;
    }[]>;
    private serialize;
}
