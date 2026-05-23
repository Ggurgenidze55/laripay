import prisma from '@/lib/prisma';
import { buildPaymentsClient, type ShopBankConfig } from '@/lib/georgian-payments';
import {
  isBankConfigured,
  parseBankCredentialsJson,
} from '@/lib/georgian-banks/config';
import type { GeorgianBankId } from '@/lib/georgian-banks/registry';
import { isGeorgianBankId } from '@/lib/georgian-banks/registry';
import { isTbcSandbox } from '@/lib/laripay-env';

export async function getMerchantBankConfig(merchantId: string): Promise<ShopBankConfig> {
  const m = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!m) throw new Error('Merchant not found');

  const provider = isGeorgianBankId(m.defaultProvider)
    ? m.defaultProvider
    : ('tbc' as GeorgianBankId);

  return {
    provider,
    testMode: isTbcSandbox(),
    tbcApiKey: m.tbcApiKey || process.env.TBC_API_KEY,
    tbcClientId: m.tbcClientId || process.env.TBC_CLIENT_ID,
    tbcClientSecret: m.tbcClientSecret || process.env.TBC_CLIENT_SECRET,
    bogPublicKey: m.bogPublicKey || process.env.BOG_PUBLIC_KEY,
    bogSecretKey: m.bogSecretKey || process.env.BOG_SECRET_KEY,
    bogCallbackPublicKey: m.bogCallbackPublicKey || process.env.BOG_CALLBACK_PUBLIC_KEY,
    bankCredentials: parseBankCredentialsJson(m.bankCredentials),
  };
}

export function buildMerchantPaymentsClient(config: ShopBankConfig) {
  return buildPaymentsClient(config);
}

export { isBankConfigured };

export async function listConfiguredBanksForMerchant(merchantId: string): Promise<GeorgianBankId[]> {
  const config = await getMerchantBankConfig(merchantId);
  const { GEORGIAN_BANKS } = await import('@/lib/georgian-banks/registry');
  return GEORGIAN_BANKS.filter((b) => isBankConfigured(config, b.id)).map((b) => b.id);
}
