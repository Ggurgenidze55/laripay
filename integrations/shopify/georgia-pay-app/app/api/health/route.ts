import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const started = Date.now();
  let db = 'ok';

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('db_timeout')), 3000);
      }),
    ]);
  } catch {
    db = 'error';
  }

  const healthy = db === 'ok';
  const body = {
    status: healthy ? 'healthy' : 'degraded',
    service: 'laripay',
    brand: 'LariPay.ai',
    phase: 3,
    database: db,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    latency_ms: Date.now() - started,
  };

  return NextResponse.json(body, { status: healthy ? 200 : 503 });
}
