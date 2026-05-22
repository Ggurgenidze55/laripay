import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getShopSession } from '@/lib/shopify';

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop');
  if (!shop) {
    return NextResponse.json({ error: 'Missing shop' }, { status: 400 });
  }

  const session = await getShopSession(shop);
  if (!session) {
    return NextResponse.json({ error: 'Shop not installed' }, { status: 401 });
  }

  const shopRecord = await prisma.shop.findUnique({
    where: { domain: shop },
    include: { settings: true },
  });

  return NextResponse.json({ settings: shopRecord?.settings || null });
}

export async function PUT(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop');
  if (!shop) {
    return NextResponse.json({ error: 'Missing shop' }, { status: 400 });
  }

  const session = await getShopSession(shop);
  if (!session) {
    return NextResponse.json({ error: 'Shop not installed' }, { status: 401 });
  }

  const body = await request.json();
  const shopRecord = await prisma.shop.findUnique({ where: { domain: shop } });
  if (!shopRecord) {
    return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
  }

  const settings = await prisma.shopSettings.upsert({
    where: { shopId: shopRecord.id },
    create: {
      shopId: shopRecord.id,
      provider: body.provider || 'tbc',
      testMode: body.testMode !== false,
      tbcApiKey: body.tbcApiKey,
      tbcClientId: body.tbcClientId,
      tbcClientSecret: body.tbcClientSecret,
      bogPublicKey: body.bogPublicKey,
      bogSecretKey: body.bogSecretKey,
      bogCallbackPublicKey: body.bogCallbackPublicKey,
      paykaApiKey: body.paykaApiKey,
    },
    update: {
      provider: body.provider,
      testMode: body.testMode,
      tbcApiKey: body.tbcApiKey,
      tbcClientId: body.tbcClientId,
      tbcClientSecret: body.tbcClientSecret,
      bogPublicKey: body.bogPublicKey,
      bogSecretKey: body.bogSecretKey,
      bogCallbackPublicKey: body.bogCallbackPublicKey,
      paykaApiKey: body.paykaApiKey,
    },
  });

  return NextResponse.json({ settings });
}
