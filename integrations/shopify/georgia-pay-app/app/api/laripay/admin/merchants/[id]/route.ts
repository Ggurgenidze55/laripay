import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { isAdminRequest } from '@/lib/laripay/admin-session';
import { getAdminMerchantDetail } from '@/lib/laripay/admin-merchants';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { formatBpsAsPercent } from '@/lib/laripay/billing';
import {
  isIntegrationPlatformId,
  setMerchantIntegration,
} from '@/lib/laripay/integration-platform';
import { isGeorgianBankId } from '@/lib/georgian-banks/registry';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await isAdminRequest(request))) {
    return laripayError('Admin authentication required', 401, 'authentication_error');
  }

  const detail = await getAdminMerchantDetail(params.id);
  if (!detail) {
    return laripayError('Merchant not found', 404, 'resource_missing');
  }

  return laripayJson(detail);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await isAdminRequest(request))) {
    return laripayError('Admin authentication required', 401, 'authentication_error');
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return laripayError('Invalid JSON');
  }

  const existing = await prisma.merchant.findUnique({ where: { id: params.id } });
  if (!existing) {
    return laripayError('Merchant not found', 404, 'resource_missing');
  }

  const data: Record<string, unknown> = {};

  if (body.status === 'suspended' || body.status === 'active') {
    data.status = body.status;
  }

  if (body.billing_mode === 'COMMISSION' || body.billing_mode === 'SUBSCRIPTION') {
    data.billingMode = body.billing_mode;
  }

  if (typeof body.default_provider === 'string' && isGeorgianBankId(body.default_provider)) {
    data.defaultProvider = body.default_provider;
  }

  const bpsRaw = body.commission_rate_bps;
  const bps =
    typeof bpsRaw === 'number' ? bpsRaw : typeof bpsRaw === 'string' ? Number(bpsRaw) : NaN;
  if (!Number.isNaN(bps) && bps >= 0) {
    data.commissionRateBps = Math.min(5000, Math.round(bps));
  }

  if (typeof body.name === 'string' && body.name.trim()) {
    data.name = body.name.trim();
  }

  let integrationUpdated = false;
  if (typeof body.integration_platform === 'string') {
    const p = body.integration_platform.trim().toLowerCase();
    if (isIntegrationPlatformId(p)) {
      await setMerchantIntegration(
        params.id,
        p,
        typeof body.integration_ref === 'string' ? body.integration_ref : null,
        { force: true },
      );
      integrationUpdated = true;
    }
  }

  if (typeof body.email === 'string' && body.email.trim()) {
    const email = body.email.trim().toLowerCase();
    const clash = await prisma.merchant.findFirst({
      where: { email, NOT: { id: params.id } },
    });
    if (clash) {
      return laripayError('Email already used by another merchant', 409);
    }
    data.email = email;
  }

  if (Object.keys(data).length === 0 && !integrationUpdated) {
    return laripayError('No valid fields to update');
  }

  if (Object.keys(data).length > 0) {
    await prisma.merchant.update({
      where: { id: params.id },
      data,
    });
  }

  const detail = await getAdminMerchantDetail(params.id);
  return laripayJson({
    ok: true,
    merchant: detail,
    commission_percent: detail ? formatBpsAsPercent(detail.commission_rate_bps) : null,
  });
}
