import prisma from '@/lib/prisma';
import {
  generateSecretKey,
  generateWebhookSecret,
  hashApiKey,
} from './crypto';
import { DEFAULT_COMMISSION_BPS } from './constants';
import type { IntegrationPlatformId } from './integration-platform';
import type { GeorgianBankId } from '@/lib/georgian-banks/registry';

export interface CreateMerchantInput {
  name: string;
  email: string;
  slug?: string;
  billingMode?: 'COMMISSION' | 'SUBSCRIPTION';
  commissionRateBps?: number;
  subscriptionPlanCode?: string;
  subscriptionMonths?: number;
  defaultProvider?: GeorgianBankId;
  integrationPlatform?: IntegrationPlatformId;
  integrationRef?: string | null;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || `merchant-${Date.now()}`;
}

export async function createMerchant(input: CreateMerchantInput) {
  const slug = input.slug || slugify(input.name);
  const billingMode = input.billingMode || 'COMMISSION';

  let subscriptionPlanId: string | undefined;
  let subscriptionActiveUntil: Date | undefined;

  if (billingMode === 'SUBSCRIPTION' && input.subscriptionPlanCode) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { code: input.subscriptionPlanCode },
    });
    if (!plan) throw new Error(`Unknown plan: ${input.subscriptionPlanCode}`);
    subscriptionPlanId = plan.id;
    const months = input.subscriptionMonths ?? 1;
    subscriptionActiveUntil = new Date();
    subscriptionActiveUntil.setMonth(subscriptionActiveUntil.getMonth() + months);
  }

  const merchant = await prisma.merchant.create({
    data: {
      name: input.name,
      email: input.email,
      slug,
      billingMode,
      commissionRateBps: input.commissionRateBps ?? DEFAULT_COMMISSION_BPS,
      subscriptionPlanId,
      subscriptionActiveUntil,
      webhookSecret: generateWebhookSecret(),
      defaultProvider: input.defaultProvider || 'tbc',
      integrationPlatform: input.integrationPlatform || 'api',
      integrationRef: input.integrationRef || null,
    },
  });

  const secretKey = generateSecretKey('test');
  await prisma.apiKey.create({
    data: {
      merchantId: merchant.id,
      keyPrefix: secretKey.slice(0, 16),
      keyHash: hashApiKey(secretKey),
      mode: 'test',
      name: 'Default',
    },
  });

  return { merchant, secretKey };
}

export async function activateSubscription(
  merchantId: string,
  planCode: string,
  months = 1,
) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { code: planCode } });
  if (!plan) throw new Error(`Unknown plan: ${planCode}`);

  const until = new Date();
  until.setMonth(until.getMonth() + months);

  return prisma.merchant.update({
    where: { id: merchantId },
    data: {
      billingMode: 'SUBSCRIPTION',
      subscriptionPlanId: plan.id,
      subscriptionActiveUntil: until,
    },
    include: { subscriptionPlan: true },
  });
}
