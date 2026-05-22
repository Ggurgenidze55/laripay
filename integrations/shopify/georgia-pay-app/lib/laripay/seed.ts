import prisma from '@/lib/prisma';
import {
  generateSecretKey,
  generatePublishableKey,
  generateWebhookSecret,
  hashApiKey,
} from './crypto';

export async function ensureLariPaySeed(): Promise<{
  merchantId: string;
  created: boolean;
  secretKey?: string;
}> {
  const plans = [
    {
      code: 'starter',
      name: 'Starter',
      priceGel: 49,
      description: 'ყოველთვიური გამოწერა — 0% საკომისიო გადახდებზე',
    },
    {
      code: 'pro',
      name: 'Pro',
      priceGel: 149,
      description: 'ბიზნესისთვის — 0% საკომისიო + პრიორიტეტი',
    },
  ];

  for (const p of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: p.code },
      create: p,
      update: { name: p.name, priceGel: p.priceGel, description: p.description },
    });
  }

  const demoSlug = 'demo-merchant';
  let created = false;
  let secretKey: string | undefined;

  const existing = await prisma.merchant.findUnique({ where: { slug: demoSlug } });
  if (!existing) {
    created = true;
    secretKey = generateSecretKey('test');
  }

  const merchant = await prisma.merchant.upsert({
    where: { slug: demoSlug },
    create: {
      name: 'Demo Merchant',
      email: 'demo@laripay.ai',
      slug: demoSlug,
      billingMode: 'COMMISSION',
      commissionRateBps: 100,
      webhookSecret: generateWebhookSecret(),
      defaultProvider: 'tbc',
    },
    update: {},
  });

  if (created && secretKey) {
    const pk = generatePublishableKey('test');
    await prisma.apiKey.create({
      data: {
        merchantId: merchant.id,
        keyPrefix: secretKey.slice(0, 16),
        keyHash: hashApiKey(secretKey),
        mode: 'test',
        name: 'Default test key',
      },
    });
    console.log('[laripay seed] Demo merchant created');
    console.log(`  slug: ${demoSlug}`);
    console.log(`  secret key (save to LARIPAY_DEMO_API_KEY): ${secretKey}`);
    console.log(`  publishable: ${pk}`);
  }

  return { merchantId: merchant.id, created, secretKey };
}
