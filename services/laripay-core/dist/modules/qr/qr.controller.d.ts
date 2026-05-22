import { RequestWithAuth } from '../../common/types/request.types';
import { QrService } from './qr.service';
export declare class QrController {
    private readonly qr;
    constructor(qr: QrService);
    create(req: RequestWithAuth, body: {
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
