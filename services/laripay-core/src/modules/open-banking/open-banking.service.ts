import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { decimalToNumber, toDecimal } from '../../common/utils/decimal.util';

const BANKS = [
  { code: 'tbc', name: 'TBC Bank', payment_system: 'opb' },
  { code: 'bog', name: 'Bank of Georgia', payment_system: 'opb' },
  { code: 'liberty', name: 'Liberty Bank', payment_system: 'opb' },
  { code: 'credo', name: 'Credo Bank', payment_system: 'opb' },
];

@Injectable()
export class OpenBankingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    private readonly config: ConfigService,
  ) {}

  listBanks() {
    return { object: 'list', data: BANKS };
  }

  async createSession(
    merchantId: string,
    body: { amount: number; currency?: string; bank?: string; success_url?: string },
  ) {
    const bank = body.bank || 'tbc';
    const token = `opb_${randomBytes(16).toString('base64url')}`;
    const intent = await this.payments.createIntent(merchantId, {
      amount: body.amount,
      currency: body.currency || 'GEL',
      metadata: { payment_system: 'opb', bank, opb_token: token },
      successUrl: body.success_url,
    });

    const base = this.config.get<string>('checkoutBaseUrl') || 'http://localhost:4000';
    return {
      payment_token: token,
      payment_system: 'opb',
      bank,
      intent_id: intent.id,
      client_secret: intent.client_secret,
      sca_url: `${base}/api/v1/open-banking/sca/${token}?bank=${bank}`,
      status: 'pending',
      amount: body.amount,
      currency: body.currency || 'GEL',
    };
  }

  getScaPage(token: string, bank: string): string {
    const label = BANKS.find((b) => b.code === bank)?.name || bank;
    return `<!DOCTYPE html><html><body style="font-family:system-ui;background:#0f172a;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center">
    <form method="POST" action="${this.config.get<string>('checkoutBaseUrl') || ''}/api/v1/open-banking/sca/${token}/approve" style="text-align:center">
    <h1>${label}</h1><p>Open Banking · SCA approval (sandbox)</p>
    <button style="padding:12px 24px;border-radius:8px;border:0;background:#06b6d4;color:#000;font-weight:600">Approve transfer</button>
    </form></body></html>`;
  }

  async approveSca(token: string) {
    const candidates = await this.prisma.paymentIntent.findMany({
      where: { status: { in: ['PENDING', 'PROCESSING', 'AUTHORIZED'] } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const intent = candidates.find((i) => {
      const meta = i.metadata as Record<string, unknown> | null;
      return meta?.opb_token === token;
    });
    if (!intent) throw new NotFoundException('OPB session not found');

    await this.payments.authorize(intent.merchantId, intent.id);
    const result = await this.payments.capture(intent.merchantId, intent.id);
    return {
      status: 'approved',
      intent_id: intent.id,
      amount: decimalToNumber(intent.amount),
      payment: result.payment,
    };
  }
}
