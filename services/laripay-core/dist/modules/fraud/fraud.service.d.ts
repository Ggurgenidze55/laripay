import { PrismaService } from '../../prisma/prisma.service';
export interface FraudScoreInput {
    merchantId: string;
    amount: number;
    currency: string;
    ipAddress?: string;
    deviceFingerprint?: string;
    paymentId?: string;
}
export interface FraudScoreResult {
    score: number;
    decision: 'allow' | 'review' | 'block';
    rules: Record<string, unknown>;
}
export declare class FraudService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    scoreTransaction(input: FraudScoreInput): Promise<FraudScoreResult>;
}
