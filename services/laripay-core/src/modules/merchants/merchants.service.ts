import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, LedgerAccountType, MerchantStatus, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { generateSecretKey, hashApiKey } from '../../common/crypto';
import { OnboardMerchantDto } from './dto/onboard-merchant.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Injectable()
export class MerchantsService {
  constructor(private readonly prisma: PrismaService) {}

  async onboardMerchant(userId: string, dto: OnboardMerchantDto) {
    const slug =
      dto.slug ||
      dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48);

    const existing = await this.prisma.merchant.findFirst({
      where: { OR: [{ email: dto.email }, { slug }] },
    });
    if (existing) throw new ConflictException('Merchant email or slug already exists');

    const webhookSecret = randomBytes(24).toString('base64url');
    const merchant = await this.prisma.merchant.create({
      data: {
        name: dto.name,
        email: dto.email,
        slug,
        status: MerchantStatus.PENDING,
        webhookSecret,
      },
    });

    await this.prisma.merchantUser.create({
      data: {
        merchantId: merchant.id,
        userId,
        role: UserRole.MERCHANT,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.MERCHANT },
    });

    const wallet = await this.prisma.wallet.create({
      data: { merchantId: merchant.id, currency: 'GEL' },
    });

    for (const type of [
      LedgerAccountType.MERCHANT_AVAILABLE,
      LedgerAccountType.MERCHANT_PENDING,
      LedgerAccountType.PAYOUT_RESERVE,
    ]) {
      await this.prisma.ledgerAccount.create({
        data: {
          walletId: wallet.id,
          merchantId: merchant.id,
          type,
          currency: 'GEL',
        },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        action: AuditAction.CREATE,
        actorId: userId,
        merchantId: merchant.id,
        entityType: 'merchant',
        entityId: merchant.id,
        metadata: { event: 'onboard' },
      },
    });

    return merchant;
  }

  async createApiKey(merchantId: string, dto: CreateApiKeyDto) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) throw new NotFoundException('Merchant not found');

    const fullKey = generateSecretKey(dto.mode);
    const apiKey = await this.prisma.apiKey.create({
      data: {
        merchantId,
        keyPrefix: fullKey.slice(0, 12),
        keyHash: hashApiKey(fullKey),
        mode: dto.mode,
        name: dto.name,
        scopes: ['payments', 'webhooks'],
      },
    });

    return {
      id: apiKey.id,
      key: fullKey,
      mode: apiKey.mode,
      prefix: apiKey.keyPrefix,
      createdAt: apiKey.createdAt,
      warning: 'Store this key securely; it will not be shown again.',
    };
  }

  async getMerchant(merchantId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      include: { apiKeys: { where: { revokedAt: null }, select: { id: true, keyPrefix: true, mode: true, name: true, lastUsedAt: true, createdAt: true } } },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');
    return merchant;
  }
}
