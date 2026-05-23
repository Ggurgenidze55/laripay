import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { getMerchantBankConfig, isBankConfigured } from '@/lib/laripay/merchant-config';
import {
  GEORGIAN_INSTALLMENT_BANKS,
  installmentBankLabel,
} from '@/lib/georgian-banks/installments';

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const config = await getMerchantBankConfig(auth.merchant.id);
  const locale = request.headers.get('accept-language')?.startsWith('ka') ? 'ka' : 'en';

  const banks = GEORGIAN_INSTALLMENT_BANKS.map((bank) => ({
    id: bank.id,
    name: installmentBankLabel(bank.id, locale),
    status: bank.installmentStatus,
    terms_months: bank.terms,
    min_amount_gel: bank.minAmountGel,
    configured: isBankConfigured(config, bank.id),
  }));

  return laripayJson({
    object: 'list',
    data: banks,
    default_provider: config.provider,
    payment_mode: 'installment',
  });
}
