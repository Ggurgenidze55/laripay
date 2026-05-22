/**
 * Universal Georgian Payment SDK — ES Module entry
 * @module georgian-payments
 */

import cjs from './georgian-payments.cjs';

export const GeorgianPayments = cjs.GeorgianPayments;
export const CURRENCY = cjs.CURRENCY;
export const TbcProvider = cjs.TbcProvider;
export const BogProvider = cjs.BogProvider;
export const verifyWebhook = cjs.verifyWebhook;

export default cjs.GeorgianPayments;
