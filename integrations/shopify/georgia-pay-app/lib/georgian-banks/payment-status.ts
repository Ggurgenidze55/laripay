import type { GeorgianBankId } from './registry';

export type BankPaymentOutcome = 'success' | 'failure' | 'processing' | 'unknown';

const GENERIC_SUCCESS = new Set([
  'succeeded',
  'completed',
  'paid',
  'success',
  'approved',
  'captured',
]);

const GENERIC_FAILURE = new Set([
  'failed',
  'rejected',
  'cancelled',
  'canceled',
  'expired',
  'declined',
  'returned',
  'error',
]);

const GENERIC_PROCESSING = new Set(['pending', 'processing', 'created', 'open', 'unknown']);

/** Map provider-specific bank status strings to success / failure / processing. */
export function classifyBankPaymentStatus(
  provider: string,
  bankStatus: string,
): BankPaymentOutcome {
  const status = String(bankStatus || '').trim();
  if (!status) return 'unknown';

  if (provider === 'tbc') {
    if (status === 'Succeeded') return 'success';
    if (['Failed', 'Expired', 'Returned'].includes(status)) return 'failure';
    if (status === 'Processing') return 'processing';
    return 'unknown';
  }

  if (provider === 'bog') {
    const key = status.toLowerCase();
    if (key === 'completed') return 'success';
    if (GENERIC_FAILURE.has(key)) return 'failure';
    if (GENERIC_PROCESSING.has(key)) return 'processing';
    return 'unknown';
  }

  const norm = status.toLowerCase();
  if (GENERIC_SUCCESS.has(norm)) return 'success';
  if (GENERIC_FAILURE.has(norm)) return 'failure';
  if (GENERIC_PROCESSING.has(norm)) return 'processing';
  return 'unknown';
}

export function isBankPaymentSuccess(provider: string, bankStatus: string): boolean {
  return classifyBankPaymentStatus(provider, bankStatus) === 'success';
}

export function isBankPaymentFailure(provider: string, bankStatus: string): boolean {
  return classifyBankPaymentStatus(provider, bankStatus) === 'failure';
}

export function asGeorgianBankId(provider: string): GeorgianBankId {
  return provider as GeorgianBankId;
}
