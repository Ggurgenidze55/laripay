import { RequestWithAuth } from '../../common/types/request.types';
import { FraudService } from './fraud.service';
export declare class FraudController {
    private readonly fraud;
    constructor(fraud: FraudService);
    score(req: RequestWithAuth, body: {
        amount: number;
        currency?: string;
        device_fp?: string;
    }): Promise<import("./fraud.service").FraudScoreResult>;
}
