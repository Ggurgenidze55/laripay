// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GeorgianPayments } = require('@georgian-payments');

import { isTbcSandbox } from './laripay-env';

export type BankProvider = 'tbc' | 'bog';

export interface ShopBankConfig {
  provider: BankProvider;
  testMode: boolean;
  tbcApiKey?: string | null;
  tbcClientId?: string | null;
  tbcClientSecret?: string | null;
  bogPublicKey?: string | null;
  bogSecretKey?: string | null;
  bogCallbackPublicKey?: string | null;
}

export function buildPaymentsClient(config: ShopBankConfig) {
  return new GeorgianPayments({
    defaultProvider: config.provider,
    tbcApiKey: config.tbcApiKey || process.env.TBC_API_KEY,
    tbcClientId: config.tbcClientId || process.env.TBC_CLIENT_ID,
    tbcSecret: config.tbcClientSecret || process.env.TBC_CLIENT_SECRET,
    bogPublicKey: config.bogPublicKey || process.env.BOG_PUBLIC_KEY,
    bogSecretKey: config.bogSecretKey || process.env.BOG_SECRET_KEY,
    bogCallbackPublicKey: config.bogCallbackPublicKey || process.env.BOG_CALLBACK_PUBLIC_KEY,
    tbcOrigin: config.testMode || isTbcSandbox() ? 'https://test-api.tbcbank.ge/v1' : undefined,
  });
}

export function assertGelCurrency(currency: string) {
  if (currency !== 'GEL') {
    throw new Error(`Georgia Pay only supports GEL checkout (received ${currency})`);
  }
}
