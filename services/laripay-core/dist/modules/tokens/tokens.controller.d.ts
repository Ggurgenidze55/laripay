import { RequestWithAuth } from '../../common/types/request.types';
import { TokensService } from './tokens.service';
export declare class TokensController {
    private readonly tokens;
    constructor(tokens: TokensService);
    tokenize(req: RequestWithAuth, body: Record<string, unknown>): Promise<{
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
