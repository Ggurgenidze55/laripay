import { Response } from 'express';
import { RequestWithAuth } from '../../common/types/request.types';
import { OpenBankingService } from './open-banking.service';
export declare class OpenBankingController {
    private readonly opb;
    constructor(opb: OpenBankingService);
    banks(): {
        object: string;
        data: {
            code: string;
            name: string;
            payment_system: string;
        }[];
    };
    create(req: RequestWithAuth, body: Record<string, unknown>): Promise<{
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
    scaPage(token: string, bank: string, res: Response): void;
    approve(token: string, res: Response): Promise<void>;
}
