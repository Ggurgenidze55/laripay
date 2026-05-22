import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TokensService {
  constructor(private readonly prisma: PrismaService) {}

  /** PCI-safe: store token reference only, never raw PAN. */
  async tokenizeCard(
    merchantId: string,
    body: {
      encrypted_payload?: string;
      last4?: string;
      brand?: string;
      exp_month?: number;
      exp_year?: number;
      customer_id?: string;
    },
  ) {
    const panFingerprint = body.encrypted_payload
      ? createHash('sha256').update(body.encrypted_payload).digest('hex').slice(0, 16)
      : randomBytes(8).toString('hex');

    const tokenRef = `tok_${randomBytes(18).toString('base64url')}`;
    const token = await this.prisma.cardToken.create({
      data: {
        merchantId,
        customerId: body.customer_id,
        tokenRef,
        last4: body.last4 || '4242',
        brand: body.brand || 'visa',
        expMonth: body.exp_month,
        expYear: body.exp_year,
        fingerprint: panFingerprint,
        encrypted: body.encrypted_payload ? '[redacted]' : null,
        provider: 'mock',
      },
    });

    return {
      id: token.id,
      object: 'card_token',
      token: tokenRef,
      last4: token.last4,
      brand: token.brand,
      exp_month: token.expMonth,
      exp_year: token.expYear,
      usable_for: ['direct', 'embedded', 'recurring'],
    };
  }
}
