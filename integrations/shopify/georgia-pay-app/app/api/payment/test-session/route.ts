import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const session = await prisma.checkoutSession.findUnique({
    where: { id },
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      clientReferenceId: true,
      provider: true,
      createdAt: true,
    },
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: session.id,
    amount: session.amount,
    currency: session.currency,
    status: session.status,
    client_reference_id: session.clientReferenceId,
    provider: session.provider,
    created: session.createdAt.toISOString(),
  });
}
