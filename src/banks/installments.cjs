'use strict';

const { GEORGIAN_BANKS } = require('./registry.cjs');

/** Default installment terms (months) per bank — merchant/bank may restrict further on hosted page. */
const DEFAULT_TERMS = [3, 6, 12, 24];

const INSTALLMENT_META = {
  tbc: { terms: [3, 6, 12, 24, 36], minAmountGel: 50, status: 'live' },
  bog: { terms: [3, 6, 12, 24], minAmountGel: 50, status: 'live' },
  liberty: { terms: [3, 6, 12, 24], minAmountGel: 100, status: 'beta' },
  credo: { terms: [3, 6, 12, 24, 36], minAmountGel: 50, status: 'beta' },
  cartu: { terms: [3, 6, 12], minAmountGel: 100, status: 'beta' },
  basis: { terms: [3, 6, 12], minAmountGel: 100, status: 'beta' },
  flitt: { terms: [3, 6, 12, 24], minAmountGel: 50, status: 'beta' },
};

const GEORGIAN_INSTALLMENT_BANKS = GEORGIAN_BANKS.map((bank) => {
  const meta = INSTALLMENT_META[bank.id] || {
    terms: DEFAULT_TERMS,
    minAmountGel: 100,
    status: 'beta',
  };
  return {
    ...bank,
    installments: true,
    installmentStatus: meta.status,
    terms: meta.terms,
    minAmountGel: meta.minAmountGel,
  };
});

function isInstallmentBankId(id) {
  return GEORGIAN_INSTALLMENT_BANKS.some((b) => b.id === id);
}

function getInstallmentBank(id) {
  return GEORGIAN_INSTALLMENT_BANKS.find((b) => b.id === id) || null;
}

function validateInstallmentTerms(bankId, terms) {
  const bank = getInstallmentBank(bankId);
  if (!bank) return false;
  if (!terms) return true;
  return bank.terms.includes(Number(terms));
}

module.exports = {
  GEORGIAN_INSTALLMENT_BANKS,
  isInstallmentBankId,
  getInstallmentBank,
  validateInstallmentTerms,
};
