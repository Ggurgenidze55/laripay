import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, MerchantStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { decimalToNumber } from '../../common/utils/decimal.util';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listMerchants() {
    const merchants = await this.prisma.merchant.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return merchants.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      slug: m.slug,
      status: m.status,
      kyc_status: m.kycStatus,
      created_at: m.createdAt,
    }));
  }

  async approveMerchant(merchantId: string, actorId: string) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) throw new NotFoundException('Merchant not found');

    const updated = await this.prisma.merchant.update({
      where: { id: merchantId },
      data: { status: MerchantStatus.ACTIVE },
    });

    await this.prisma.auditLog.create({
      data: {
        action: AuditAction.ADMIN,
        actorId,
        merchantId,
        entityType: 'merchant',
        entityId: merchantId,
        metadata: { event: 'approve' },
      },
    });

    return updated;
  }

  async listPayments(limit = 100) {
    const payments = await this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { merchant: { select: { id: true, name: true, slug: true } } },
    });

    return payments.map((p) => ({
      id: p.id,
      merchant_id: p.merchantId,
      merchant_name: p.merchant.name,
      status: p.status,
      amount: decimalToNumber(p.amount),
      currency: p.currency,
      provider: p.provider,
      created_at: p.createdAt,
    }));
  }

  async listAuditLogs(limit = 200) {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        actor: { select: { id: true, email: true } },
        merchant: { select: { id: true, name: true } },
      },
    });

    return logs.map((l) => ({
      id: l.id,
      action: l.action,
      actor: l.actor,
      merchant: l.merchant,
      entity_type: l.entityType,
      entity_id: l.entityId,
      metadata: l.metadata,
      created_at: l.createdAt,
    }));
  }

  async listDisputes(limit = 100) {
    const rows = await this.prisma.dispute.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { payment: { include: { merchant: { select: { name: true, slug: true } } } } },
    });
    return rows.map((d) => ({
      id: d.id,
      payment_id: d.paymentId,
      status: d.status,
      amount: decimalToNumber(d.amount),
      merchant: d.payment.merchant.name,
      created_at: d.createdAt,
    }));
  }

  async listFraudChecks(limit = 100) {
    return this.prisma.fraudCheck.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
