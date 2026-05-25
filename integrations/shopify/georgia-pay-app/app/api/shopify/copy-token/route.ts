import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get('from');
  const to = request.nextUrl.searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to params required' }, { status: 400 });
  }

  const source = await prisma.shop.findUnique({ where: { domain: from } });
  if (!source) {
    return NextResponse.json({ error: `Source shop ${from} not found` }, { status: 404 });
  }

  await prisma.shop.upsert({
    where: { domain: to },
    create: { domain: to, accessToken: source.accessToken },
    update: { accessToken: source.accessToken },
  });

  return NextResponse.json({ success: true, from, to, message: 'Token copied' });
}
