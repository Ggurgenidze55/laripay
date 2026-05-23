'use strict';

const crypto = require('node:crypto');
const { TBC, BOG } = require('./constants.cjs');

function timingSafeEqualHex(a, b) {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function normalizeHmacSignature(sig) {
  if (!sig) return '';
  return String(sig).replace(/^sha256=/i, '').trim();
}

function computeHmacSha256(secret, rawBody) {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

/**
 * TBC webhook — HMAC-SHA256 verification.
 * @param {string|Buffer|object} payload - Raw body string/Buffer, or object (will be JSON.stringify'd)
 * @param {string} signature
 * @param {string} secret - tbcSecret / webhook secret
 */
function verifyTbcWebhook(payload, signature, secret) {
  if (!secret) {
    return { valid: false, error: 'TBC webhook secret is required for HMAC verification' };
  }

  const rawBody = Buffer.isBuffer(payload)
    ? payload.toString('utf8')
    : typeof payload === 'string'
      ? payload
      : JSON.stringify(payload);

  if (!signature) {
    return { valid: false, error: 'Missing webhook signature' };
  }

  const expected = computeHmacSha256(secret, rawBody);
  const received = normalizeHmacSignature(signature);

  if (!timingSafeEqualHex(expected, received)) {
    return { valid: false, error: 'Invalid HMAC-SHA256 signature' };
  }

  let data;
  try {
    data = JSON.parse(rawBody);
  } catch {
    return { valid: false, error: 'Invalid JSON payload' };
  }

  const paymentId = data.PaymentId || data.paymentId || data.payId || null;

  return {
    valid: true,
    provider: 'tbc',
    paymentId,
    payload: data,
  };
}

/**
 * BOG webhook — RSA SHA256withRSA (Callback-Signature header value).
 * @param {string|Buffer|object} payload
 * @param {string} signature - base64 RSA signature
 * @param {string} [publicKey] - PEM public key (defaults to BOG published key)
 */
function verifyBogWebhook(payload, signature, publicKey) {
  const rawBody = Buffer.isBuffer(payload)
    ? payload.toString('utf8')
    : typeof payload === 'string'
      ? payload
      : JSON.stringify(payload);

  const key = publicKey || BOG.DEFAULT_CALLBACK_PUBLIC_KEY;

  if (!signature) {
    return { valid: false, error: 'Missing Callback-Signature' };
  }

  try {
    const verified = crypto.verify(
      'RSA-SHA256',
      Buffer.from(rawBody, 'utf8'),
      key,
      Buffer.from(signature, 'base64')
    );

    if (!verified) {
      return { valid: false, error: 'Invalid RSA signature' };
    }
  } catch (err) {
    return { valid: false, error: `Signature verification failed: ${err.message}` };
  }

  let data;
  try {
    data = JSON.parse(rawBody);
  } catch {
    return { valid: false, error: 'Invalid JSON payload' };
  }

  return {
    valid: true,
    provider: 'bog',
    orderId: data.body?.order_id ?? data.order_id ?? null,
    event: data.event ?? null,
    payload: data,
  };
}

function verifyWebhook(provider, payload, signature, options = {}) {
  if (provider === 'tbc') {
    return verifyTbcWebhook(payload, signature, options.secret || options.tbcSecret);
  }
  if (provider === 'bog') {
    return verifyBogWebhook(payload, signature, options.publicKey || options.bogPublicKey);
  }
  return { valid: false, error: `Unknown provider: ${provider}` };
}

module.exports = {
  verifyTbcWebhook,
  verifyBogWebhook,
  verifyWebhook,
  computeHmacSha256,
};
