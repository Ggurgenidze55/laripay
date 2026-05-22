import { RequestWithAuth } from '../../common/types/request.types';
import { PayoutsService } from './payouts.service';
import { CreatePayoutDto } from './dto/create-payout.dto';
export declare class PayoutsController {
    private readonly payouts;
    constructor(payouts: PayoutsService);
    create(req: RequestWithAuth, dto: CreatePayoutDto): Promise<{
        id: string;
        amount: number;
        currency: string;
        status: import(".prisma/client").$Enums.PayoutStatus;
        bank_iban: string | null;
        scheduled_at: Date | null;
        created_at: Date;
    }>;
    list(req: RequestWithAuth): Promise<{
        id: string;
        amount: number;
        currency: string;
        status: import(".prisma/client").$Enums.PayoutStatus;
        bank_iban: string | null;
        scheduled_at: Date | null;
        created_at: Date;
    }[]>;
}
