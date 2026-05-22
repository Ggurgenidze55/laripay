import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { decimalToNumber, toDecimal } from '../../common/utils/decimal.util';

@Injectable()
export class QrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async create(merchantId: string, body: { amount: number; currency?: string; order_id?: string }) {
    const code = randomBytes(10).toString('base64url');
    const base = this.config.get<string>('checkoutBaseUrl') || 'http://localhost:4000';
    const payloadUrl = `${base}/api/v1/qr/${code}`;

    const qr = await this.prisma.qrPayment.create({
      data: {
        merchantId,
        orderId: body.order_id,
        code,
        amount: toDecimal(body.amount),
        currency: body.currency || 'GEL',
        payloadUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return {
      id: qr.id,
      code: qr.code,
      amount: decimalToNumber(qr.amount),
      currency: qr.currency,
      qr_url: payloadUrl,
      status: qr.status,
      expires_at: Math.floor(qr.expiresAt.getTime() / 1000),
    };
  }

  async resolve(code: string) {
    const qr = await this.prisma.qrPayment.findUnique({ where: { code } });
    if (!qr) return { error: 'not_found' };
    return {
      code: qr.code,
      amount: decimalToNumber(qr.amount),
      currency: qr.currency,
      status: qr.status,
      pay_url: qr.payloadUrl,
    };
  }
}
