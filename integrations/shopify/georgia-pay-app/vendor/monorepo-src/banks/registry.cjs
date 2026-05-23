'use strict';

/** Georgian acquiring / payment rails for e-commerce (bank-hosted card checkout). */
const GEORGIAN_BANKS = [
  {
    id: 'tbc',
    name: 'TBC Pay',
    nameKa: 'თიბისი Pay',
    status: 'live',
    cards: true,
    wallets: ['apple_pay', 'google_pay'],
    envPrefix: 'TBC',
  },
  {
    id: 'bog',
    name: 'Bank of Georgia (BOG Pay)',
    nameKa: 'საქართველოს ბანკი (BOG Pay)',
    status: 'live',
    cards: true,
    wallets: ['apple_pay', 'google_pay'],
    envPrefix: 'BOG',
  },
  {
    id: 'liberty',
    name: 'Liberty Bank',
    nameKa: 'ლიბერთი ბანკი',
    status: 'beta',
    cards: true,
    wallets: [],
    envPrefix: 'LIBERTY',
  },
  {
    id: 'credo',
    name: 'Credo Bank',
    nameKa: 'კრედო ბანკი',
    status: 'beta',
    cards: true,
    wallets: ['apple_pay', 'google_pay'],
    envPrefix: 'CREDO',
  },
  {
    id: 'cartu',
    name: 'Cartu Bank',
    nameKa: 'კარტუ ბანკი',
    status: 'beta',
    cards: true,
    wallets: [],
    envPrefix: 'CARTU',
  },
  {
    id: 'basis',
    name: 'Basis Bank',
    nameKa: 'ბაზის ბანკი',
    status: 'beta',
    cards: true,
    wallets: [],
    envPrefix: 'BASIS',
  },
  {
    id: 'flitt',
    name: 'Flitt (aggregator)',
    nameKa: 'Flitt (აგრეგატორი)',
    status: 'beta',
    cards: true,
    wallets: ['apple_pay', 'google_pay'],
    envPrefix: 'FLITT',
  },
];

const BANK_IDS = GEORGIAN_BANKS.map((b) => b.id);

function isGeorgianBankId(id) {
  return BANK_IDS.includes(id);
}

function getBank(id) {
  return GEORGIAN_BANKS.find((b) => b.id === id) || null;
}

function liveBankIds() {
  return GEORGIAN_BANKS.filter((b) => b.status === 'live').map((b) => b.id);
}

module.exports = { GEORGIAN_BANKS, BANK_IDS, isGeorgianBankId, getBank, liveBankIds };
