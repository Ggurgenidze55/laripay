import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthenticatedMerchantContext {
  id: string;
  slug: string;
  email: string;
  status: string;
  webhookSecret: string;
  defaultProvider: string;
  commissionRateBps: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  merchantId?: string;
}

export interface RequestWithAuth extends Request {
  user?: JwtPayload & { userId: string };
  merchant?: AuthenticatedMerchantContext;
  merchantId?: string;
  apiKeyId?: string;
}
