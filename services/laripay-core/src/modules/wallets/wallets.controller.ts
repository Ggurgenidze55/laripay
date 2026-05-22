import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { RequestWithAuth } from '../../common/types/request.types';
import { LedgerService } from '../ledger/ledger.service';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('wallets')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('v1/wallets')
export class WalletsController {
  constructor(
    private readonly ledger: LedgerService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('balance')
  async balance(@Req() req: RequestWithAuth) {
    const balances = await this.ledger.getMerchantBalances(req.merchantId!);
    return {
      object: 'balance',
      currency: 'GEL',
      available: balances.available,
      pending: balances.pending,
      payout_reserve: balances.payoutReserve,
    };
  }

  @Get('ledger')
  async ledgerEntries(@Req() req: RequestWithAuth) {
    const accounts = await this.prisma.ledgerAccount.findMany({
      where: { merchantId: req.merchantId },
      include: {
        entries: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    return {
      object: 'ledger',
      accounts: accounts.map((a) => ({
        id: a.id,
        type: a.type,
        currency: a.currency,
        entries: a.entries,
      })),
    };
  }
}
