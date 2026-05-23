#!/usr/bin/env node
/**
 * Smoke test: ESM + CJS imports and webhook HMAC verification.
 */
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');

async function testEsm() {
  const { GeorgianPayments, CURRENCY } = await import('../src/georgian-payments.js');
  assert.equal(CURRENCY.CODE, 'GEL');
  assert.equal(CURRENCY.NUMERIC, 981);

  const gp = new GeorgianPayments({
    tbcClientId: 'test-id',
    tbcSecret: 'test-secret',
    bogPublicKey: 'pub',
    bogSecretKey: 'sec',
  });

  assert.ok(gp.tbc);
  assert.ok(gp.bog);

  const rawBody = JSON.stringify({ PaymentId: 'tpay-abc123' });
  const sig = crypto.createHmac('sha256', 'test-secret').update(rawBody).digest('hex');
  const result = gp.handleWebhook('tbc', rawBody, sig);
  assert.equal(result.valid, true);
  assert.equal(result.paymentId, 'tpay-abc123');

  console.log('ESM: OK');
}

function testCjs() {
  const { GeorgianPayments, verifyWebhook } = require('../src/georgian-payments.cjs');

  const rawBody = '{"PaymentId":"pay-1"}';
  const sig = crypto.createHmac('sha256', 'my-secret').update(rawBody).digest('hex');
  const result = verifyWebhook('tbc', rawBody, sig, { secret: 'my-secret' });
  assert.equal(result.valid, true);

  const gp = new GeorgianPayments({ tbcClientId: 'a', tbcSecret: 'b' });
  assert.equal(gp.bog, null);

  console.log('CJS: OK');
}

async function testCjsAsync() {
  const { GeorgianPayments } = require('../src/georgian-payments.cjs');
  const gp = new GeorgianPayments({ tbcClientId: 'a', tbcSecret: 'b' });
  await assert.rejects(
    () => gp.createPayment(10, 'GEL', '1', 'https://x.ge', { provider: 'bog' }),
    /BOG.*not configured/i,
  );
}

testCjs();
testCjsAsync()
  .then(() => testEsm())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
