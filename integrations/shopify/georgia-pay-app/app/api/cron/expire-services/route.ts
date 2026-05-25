import { NextRequest, NextResponse } from 'next/server';
import { suspendExpiredServices } from '@/lib/laripay/service-gate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const count = await suspendExpiredServices();
    return NextResponse.json({
      success: true,
      suspended_count: count,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[cron/expire-services]', err);
    return NextResponse.json(
      { error: 'Failed to process expired services' },
      { status: 500 },
    );
  }
}
