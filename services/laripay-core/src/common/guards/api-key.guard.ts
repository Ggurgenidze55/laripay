import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { MerchantStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { hashApiKey } from '../crypto';
import { RequestWithAuth } from '../types/request.types';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithAuth>();
    const auth = (req.headers as Record<string, string | string[] | undefined>)['authorization'];
    const bearer =
      typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    const headerKey =
      (req.headers as Record<string, string | undefined>)['x-laripay-api-key'] ||
      (req.headers as Record<string, string | undefined>)['x-payka-api-key'] ||
      '';
    const fullKey = bearer || headerKey;

    if (!fullKey || (!fullKey.startsWith('sk_test_') && !fullKey.startsWith('sk_live_'))) {
      throw new UnauthorizedException(
        'Missing or invalid API key. Use Authorization: Bearer sk_test_...',
      );
    }

    const keyHash = hashApiKey(fullKey);
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { merchant: true },
    });

    if (!apiKey || apiKey.revokedAt) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (apiKey.merchant.status !== MerchantStatus.ACTIVE) {
      throw new ForbiddenException('Merchant account is not active');
    }

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    const m = apiKey.merchant;
    req.merchantId = m.id;
    req.apiKeyId = apiKey.id;
    req.merchant = {
      id: m.id,
      slug: m.slug,
      email: m.email,
      status: m.status,
      webhookSecret: m.webhookSecret,
      defaultProvider: m.defaultProvider,
      commissionRateBps: m.commissionRateBps,
    };

    return true;
  }
}
