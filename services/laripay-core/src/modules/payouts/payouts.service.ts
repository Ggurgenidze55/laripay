import { Injectable } from '@nestjs/common';
import { AuditAction, PayoutStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { decimalToNumber, toDecimal } from '../../common/utils/decimal.util';
import { CreatePayoutDto } from './dto/create-payout.dto';

@Injectable()
export class PayoutsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(merchantId: string, dto: CreatePayoutDto, actorId?: string) {
    const payout = await this.prisma.payout.create({
      data: {
        merchantId,
        amount: toDecimal(dto.amount),
        currency: dto.currency || 'GEL',
        status: PayoutStatus.PENDING,
        bankIban: dto.bankIban,
        scheduledAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: AuditAction.PAYOUT,
        actorId,
        merchantId,
        entityType: 'payout',
        entityId: payout.id,
        metadata: { amount: dto.amount },
      },
    });

    return this.serialize(payout);
  }

  async list(merchantId: string) {
    const payouts = await this.prisma.payout.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return payouts.map((p) => this.serialize(p));
  }

  private serialize(payout: {
    id: string;
    amount: { toString(): string };
    currency: string;
    status: PayoutStatus;
    bankIban: string | null;
    scheduledAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: payout.id,
      amount: decimalToNumber(payout.amount as never),
      currency: payout.currency,
      status: payout.status,
      bank_iban: payout.bankIban,
      scheduled_at: payout.scheduledAt,
      created_at: payout.createdAt,
    };
  }
}
