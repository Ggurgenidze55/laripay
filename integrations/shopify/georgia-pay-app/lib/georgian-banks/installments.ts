import { GEORGIAN_BANKS, type GeorgianBankId } from './registry';

export type InstallmentBankMeta = {
  id: GeorgianBankId;
  name: string;
  nameKa: string;
  installmentStatus: 'live' | 'beta';
  terms: readonly number[];
  minAmountGel: number;
};

const INSTALLMENT_META: Record<
  GeorgianBankId,
  { terms: number[]; minAmountGel: number; installmentStatus: 'live' | 'beta' }
> = {
  tbc: { terms: [3, 6, 12, 24, 36], minAmountGel: 50, installmentStatus: 'live' },
  bog: { terms: [3, 6, 12, 24], minAmountGel: 50, installmentStatus: 'live' },
  liberty: { terms: [3, 6, 12, 24], minAmountGel: 100, installmentStatus: 'beta' },
  credo: { terms: [3, 6, 12, 24, 36], minAmountGel: 50, installmentStatus: 'beta' },
  cartu: { terms: [3, 6, 12], minAmountGel: 100, installmentStatus: 'beta' },
  basis: { terms: [3, 6, 12], minAmountGel: 100, installmentStatus: 'beta' },
  flitt: { terms: [3, 6, 12, 24], minAmountGel: 50, installmentStatus: 'beta' },
};

export const GEORGIAN_INSTALLMENT_BANKS: InstallmentBankMeta[] = GEORGIAN_BANKS.map((bank) => {
  const meta = INSTALLMENT_META[bank.id];
  return {
    id: bank.id,
    name: bank.name,
    nameKa: bank.nameKa,
    installmentStatus: meta.installmentStatus,
    terms: meta.terms,
    minAmountGel: meta.minAmountGel,
  };
});

export type PaymentMode = 'card' | 'installment';

export function getInstallmentBank(id: string) {
  return GEORGIAN_INSTALLMENT_BANKS.find((b) => b.id === id) ?? null;
}

export function validateInstallmentTerms(bankId: GeorgianBankId, terms?: number | null): boolean {
  const bank = getInstallmentBank(bankId);
  if (!bank) return false;
  if (terms == null) return true;
  return bank.terms.includes(Number(terms));
}

export function installmentBankLabel(id: GeorgianBankId, locale: 'en' | 'ka' = 'en'): string {
  const bank = getInstallmentBank(id);
  if (!bank) return id;
  return locale === 'ka' ? bank.nameKa : bank.name;
}
