import { NextRequest } from 'next/server';
import { requireAdminOrError } from '@/lib/laripay/auth';
import { retryFailedWebhookDeliveries } from '@/lib/laripay/webhook-retry';
import { laripayJson } from '@/lib/laripay/api-response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const adminErr = requireAdminOrError(request);
  if (adminErr) return adminErr;

  const result = await retryFailedWebhookDeliveries();
  return laripayJson({ object: 'webhook_retry_job', ...result });
}
