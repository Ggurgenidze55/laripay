export const GEORGIAN_BANKS = [
  {
    id: 'tbc',
    name: 'TBC Pay',
    nameKa: 'თიბისი Pay',
    status: 'live' as const,
    cards: true,
    wallets: ['apple_pay', 'google_pay'] as const,
    envPrefix: 'TBC',
  },
  {
    id: 'bog',
    name: 'Bank of Georgia (BOG Pay)',
    nameKa: 'საქართველოს ბანკი (BOG Pay)',
    status: 'live' as const,
    cards: true,
    wallets: ['apple_pay', 'google_pay'] as const,
    envPrefix: 'BOG',
  },
  {
    id: 'liberty',
    name: 'Liberty Bank',
    nameKa: 'ლიბერთი ბანკი',
    status: 'beta' as const,
    cards: true,
    wallets: [] as const,
    envPrefix: 'LIBERTY',
  },
  {
    id: 'credo',
    name: 'Credo Bank',
    nameKa: 'კრედო ბანკი',
    status: 'beta' as const,
    cards: true,
    wallets: ['apple_pay', 'google_pay'] as const,
    envPrefix: 'CREDO',
  },
  {
    id: 'cartu',
    name: 'Cartu Bank',
    nameKa: 'კარტუ ბანკი',
    status: 'beta' as const,
    cards: true,
    wallets: [] as const,
    envPrefix: 'CARTU',
  },
  {
    id: 'basis',
    name: 'Basis Bank',
    nameKa: 'ბაზის ბანკი',
    status: 'beta' as const,
    cards: true,
    wallets: [] as const,
    envPrefix: 'BASIS',
  },
  {
    id: 'flitt',
    name: 'Flitt (aggregator)',
    nameKa: 'Flitt (აგრეგატორი)',
    status: 'beta' as const,
    cards: true,
    wallets: ['apple_pay', 'google_pay'] as const,
    envPrefix: 'FLITT',
  },
] as const;

export type GeorgianBankId = (typeof GEORGIAN_BANKS)[number]['id'];
export type GeorgianBankStatus = (typeof GEORGIAN_BANKS)[number]['status'];

export type RedirectBankCredentials = {
  merchantId?: string | null;
  secretKey?: string | null;
  apiOrigin?: string | null;
};

export type BankCredentialsMap = Partial<Record<GeorgianBankId, RedirectBankCredentials>>;

export function isGeorgianBankId(value: string): value is GeorgianBankId {
  return GEORGIAN_BANKS.some((b) => b.id === value);
}

export function getGeorgianBank(id: string) {
  return GEORGIAN_BANKS.find((b) => b.id === id) ?? null;
}

export function liveGeorgianBankIds(): GeorgianBankId[] {
  return GEORGIAN_BANKS.filter((b) => b.status === 'live').map((b) => b.id);
}

export function georgianBankLabel(id: GeorgianBankId, locale: 'en' | 'ka' = 'en'): string {
  const bank = getGeorgianBank(id);
  if (!bank) return id;
  return locale === 'ka' ? bank.nameKa : bank.name;
}

export function isRedirectBank(id: GeorgianBankId): boolean {
  return id !== 'tbc' && id !== 'bog';
}
