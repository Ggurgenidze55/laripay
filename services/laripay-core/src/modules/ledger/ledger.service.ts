import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LedgerAccountType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { decimalToNumber, toDecimal } from '../../common/utils/decimal.util';
import { randomBytes } from 'crypto';

export interface LedgerPostingLine {
  accountType: LedgerAccountType;
  debit?: number;
  credit?: number;
  description?: string;
}

export interface PostTransactionInput {
  merchantId: string;
  currency?: string;
  referenceType?: string;
  referenceId?: string;
  lines: LedgerPostingLine[];
}

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async postTransaction(input: PostTransactionInput) {
    const currency = input.currency || 'GEL';
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of input.lines) {
      const debit = line.debit ?? 0;
      const credit = line.credit ?? 0;
      if (debit < 0 || credit < 0) throw new BadRequestException('Negative amounts not allowed');
      if (debit > 0 && credit > 0) throw new BadRequestException('Line cannot have both debit and credit');
      totalDebit += debit;
      totalCredit += credit;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new BadRequestException('Debits must equal credits');
    }

    const accounts = await this.prisma.ledgerAccount.findMany({
      where: { merchantId: input.merchantId, currency },
    });

    const accountByType = new Map(accounts.map((a) => [a.type, a]));
    const transactionId = `txn_${randomBytes(12).toString('base64url')}`;

    const entries = input.lines.map((line) => {
      const account = accountByType.get(line.accountType);
      if (!account) {
        throw new NotFoundException(`Ledger account ${line.accountType} not found`);
      }
      return {
        transactionId,
        accountId: account.id,
        debit: toDecimal(line.debit ?? 0),
        credit: toDecimal(line.credit ?? 0),
        currency,
        description: line.description,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
      };
    });

    await this.prisma.ledgerEntry.createMany({ data: entries });

    return { transactionId, entries: entries.length };
  }

  async getMerchantBalances(merchantId: string, currency = 'GEL') {
    const rows = await this.getMerchantBalance(merchantId, currency);
    const pick = (type: LedgerAccountType) =>
      rows.find((r) => r.type === type)?.balance ?? 0;
    return {
      available: pick(LedgerAccountType.MERCHANT_AVAILABLE),
      pending: pick(LedgerAccountType.MERCHANT_PENDING),
      payoutReserve: pick(LedgerAccountType.PAYOUT_RESERVE),
    };
  }

  async getMerchantBalance(merchantId: string, currency = 'GEL') {
    const accounts = await this.prisma.ledgerAccount.findMany({
      where: { merchantId, currency },
      include: { entries: true },
    });

    return accounts.map((account) => {
      let balance = 0;
      for (const entry of account.entries) {
        balance += decimalToNumber(entry.credit) - decimalToNumber(entry.debit);
      }
      return {
        accountId: account.id,
        type: account.type,
        currency: account.currency,
        balance,
      };
    });
  }

  async ensureMerchantAccounts(merchantId: string, currency = 'GEL') {
    let wallet = await this.prisma.wallet.findFirst({ where: { merchantId, currency } });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({ data: { merchantId, currency } });
    }

    for (const type of [
      LedgerAccountType.MERCHANT_AVAILABLE,
      LedgerAccountType.MERCHANT_PENDING,
      LedgerAccountType.PLATFORM_REVENUE,
    ]) {
      await this.prisma.ledgerAccount.upsert({
        where: {
          walletId_type_currency: { walletId: wallet.id, type, currency },
        },
        create: { walletId: wallet.id, merchantId, type, currency },
        update: {},
      });
    }
  }

  async recordPaymentCapture(
    merchantId: string,
    paymentId: string,
    grossAmount: number,
    netAmount: number,
    platformFee: number,
    currency = 'GEL',
  ) {
    await this.ensureMerchantAccounts(merchantId, currency);
    return this.postTransaction({
      merchantId,
      currency,
      referenceType: 'payment',
      referenceId: paymentId,
      lines: [
        {
          accountType: LedgerAccountType.MERCHANT_PENDING,
          debit: grossAmount,
          description: 'Payment capture — gross',
        },
        {
          accountType: LedgerAccountType.PLATFORM_REVENUE,
          credit: platformFee,
          description: 'Platform fee',
        },
        {
          accountType: LedgerAccountType.MERCHANT_AVAILABLE,
          credit: netAmount,
          description: 'Net to merchant available',
        },
      ],
    });
  }
}
