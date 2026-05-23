import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { getWarehouseSyncJob } from '@/lib/laripay/warehouse-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await authenticateApiRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const job = await getWarehouseSyncJob(auth.merchant.id, params.id);
  if (!job) {
    return laripayError('Sync job not found', 404, 'not_found');
  }
  return laripayJson(job);
}
