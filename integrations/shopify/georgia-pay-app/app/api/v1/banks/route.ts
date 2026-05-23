import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { getMerchantBankConfig, isBankConfigured } from '@/lib/laripay/merchant-config';
import { GEORGIAN_BANKS, georgianBankLabel } from '@/lib/georgian-banks/registry';

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const config = await getMerchantBankConfig(auth.merchant.id);
  const locale = request.headers.get('accept-language')?.startsWith('ka') ? 'ka' : 'en';

  const banks = GEORGIAN_BANKS.map((bank) => ({
    id: bank.id,
    name: georgianBankLabel(bank.id, locale),
    status: bank.status,
    cards: bank.cards,
    wallets: bank.wallets,
    configured: isBankConfigured(config, bank.id),
  }));

  return laripayJson({
    object: 'list',
    data: banks,
    default_provider: config.provider,
  });
}
