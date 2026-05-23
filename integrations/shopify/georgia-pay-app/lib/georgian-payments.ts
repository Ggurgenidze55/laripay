// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GeorgianPayments } = require('@georgian-payments');

import { isTbcSandbox } from './laripay-env';
import type { GeorgianBankId } from './georgian-banks/registry';
import type { ShopBankConfig } from './georgian-banks/config';

export type { ShopBankConfig, GeorgianBankId };
export { isBankConfigured, redirectCredentialsForBank } from './georgian-banks/config';
export {
  GEORGIAN_BANKS,
  georgianBankLabel,
  isGeorgianBankId,
  getGeorgianBank,
} from './georgian-banks/registry';

export function buildPaymentsClient(config: ShopBankConfig) {
  const clientConfig: Record<string, unknown> = {
    defaultProvider: config.provider,
    tbcApiKey: config.tbcApiKey || process.env.TBC_API_KEY,
    tbcClientId: config.tbcClientId || process.env.TBC_CLIENT_ID,
    tbcSecret: config.tbcClientSecret || process.env.TBC_CLIENT_SECRET,
    bogPublicKey: config.bogPublicKey || process.env.BOG_PUBLIC_KEY,
    bogSecretKey: config.bogSecretKey || process.env.BOG_SECRET_KEY,
    bogCallbackPublicKey: config.bogCallbackPublicKey || process.env.BOG_CALLBACK_PUBLIC_KEY,
    bankCredentials: config.bankCredentials || undefined,
    tbcOrigin: config.testMode || isTbcSandbox() ? 'https://test-api.tbcbank.ge/v1' : undefined,
  };

  return new GeorgianPayments(clientConfig);
}

export function assertGelCurrency(currency: string) {
  if (currency !== 'GEL') {
    throw new Error(`Georgia Pay only supports GEL checkout (received ${currency})`);
  }
}

/** @deprecated use GeorgianBankId */
export type BankProvider = GeorgianBankId;
