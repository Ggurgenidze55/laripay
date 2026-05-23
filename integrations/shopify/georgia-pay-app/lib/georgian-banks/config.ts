import type { BankCredentialsMap, GeorgianBankId } from '@/lib/georgian-banks/registry';
import { GEORGIAN_BANKS, isRedirectBank } from '@/lib/georgian-banks/registry';

export type ShopBankConfig = {
  provider: GeorgianBankId;
  testMode: boolean;
  tbcApiKey?: string | null;
  tbcClientId?: string | null;
  tbcClientSecret?: string | null;
  bogPublicKey?: string | null;
  bogSecretKey?: string | null;
  bogCallbackPublicKey?: string | null;
  bankCredentials?: BankCredentialsMap | null;
};

function envRedirectCreds(bankId: GeorgianBankId) {
  const meta = GEORGIAN_BANKS.find((b) => b.id === bankId);
  const prefix = meta?.envPrefix || bankId.toUpperCase();
  return {
    merchantId: process.env[`${prefix}_MERCHANT_ID`] || null,
    secretKey: process.env[`${prefix}_SECRET_KEY`] || null,
    apiOrigin: process.env[`${prefix}_API_ORIGIN`] || null,
  };
}

export function redirectCredentialsForBank(
  config: ShopBankConfig,
  bankId: GeorgianBankId,
): { merchantId: string | null; secretKey: string | null; apiOrigin: string | null } {
  const fromJson = config.bankCredentials?.[bankId];
  const fromEnv = envRedirectCreds(bankId);
  return {
    merchantId: fromJson?.merchantId || fromEnv.merchantId,
    secretKey: fromJson?.secretKey || fromEnv.secretKey,
    apiOrigin: fromJson?.apiOrigin || fromEnv.apiOrigin,
  };
}

export function isBankConfigured(config: ShopBankConfig, bankId: GeorgianBankId): boolean {
  if (bankId === 'tbc') {
    return Boolean(config.tbcClientId && config.tbcClientSecret);
  }
  if (bankId === 'bog') {
    return Boolean(config.bogPublicKey && config.bogSecretKey);
  }
  if (isRedirectBank(bankId)) {
    const c = redirectCredentialsForBank(config, bankId);
    return Boolean(c.merchantId && c.secretKey && c.apiOrigin);
  }
  return false;
}

export function parseBankCredentialsJson(raw: unknown): BankCredentialsMap | null {
  if (!raw || typeof raw !== 'object') return null;
  return raw as BankCredentialsMap;
}
