import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

@Injectable()
export class FraudService {
  constructor(private readonly prisma: PrismaService) {}

  async scoreTransaction(input: FraudScoreInput): Promise<FraudScoreResult> {
    const rules: Record<string, unknown> = {};
    let score = 0;

    if (input.ipAddress?.startsWith('10.') || input.ipAddress === '127.0.0.1') {
      score += 5;
      rules.privateIp = true;
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await this.prisma.paymentIntent.count({
      where: {
        merchantId: input.merchantId,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentCount > 20) {
      score += 40;
      rules.velocityExceeded = { count: recentCount, window: '1h' };
    } else if (recentCount > 10) {
      score += 20;
      rules.velocityElevated = { count: recentCount, window: '1h' };
    }

    if (input.amount >= 5000) {
      score += 15;
      rules.highAmount = input.amount;
    }

    let decision: FraudScoreResult['decision'] = 'allow';
    if (score >= 60) decision = 'block';
    else if (score >= 30) decision = 'review';

    await this.prisma.fraudCheck.create({
      data: {
        merchantId: input.merchantId,
        paymentId: input.paymentId,
        score,
        decision,
        ipAddress: input.ipAddress,
        deviceFp: input.deviceFingerprint,
        rules: rules as Prisma.InputJsonValue,
      },
    });

    return { score, decision, rules };
  }
}
