'use strict';

const CURRENCY = {
  CODE: 'GEL',
  NUMERIC: 981,
};

const TBC = {
  API_ORIGIN: 'https://api.tbcbank.ge',
  TOKEN_PATH: '/tpay/access-token',
  PAYMENTS_PATH: '/tpay/payments',
  CALLBACK_IPS: [
    '193.104.20.44',
    '193.104.20.45',
    '185.52.80.44',
    '185.52.80.45',
  ],
  SIGNATURE_HEADERS: ['X-TBC-Signature', 'Callback-Signature', 'X-Signature'],
};

const BOG = {
  API_ORIGIN: 'https://api.bog.ge',
  ORDERS_PATH: '/payments/v1/ecommerce/orders',
  REFUND_PATH: '/payments/v1/ecommerce/orders', // + /{orderId}/refund
  RECEIPT_PATH: '/payments/v1/receipt',
  OAUTH_PATH: '/auth/realms/bog/protocol/openid-connect/token',
  OAUTH_ORIGIN: 'https://oauth2.bog.ge',
  SIGNATURE_HEADER: 'Callback-Signature',
  DEFAULT_CALLBACK_PUBLIC_KEY: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4RUyAw3+CdkS3ZNILQh
zHI9Hemo+vKB9U2BSabppkKjzjjkf+0Sm76hSMiu/HFtYhqWOESryoCDJoqffY0Q
1VNt25aTxbj068QNUtnxQ7KQVLA+pG0smf+EBWlS1vBEAFbIas9d8c9b9sSEkTrr
TYQ90WIM8bGB6S/KLVoT1a7SnzabjoLc5Qf/SLDG5fu8dH8zckyeYKdRKSBJKvh
xtcBuHV4f7qsynQT+f2UYbESX/TLHwT5qFWZDHZ0YUOUIvb8n7JujVSGZO9/+ll/
g4ZIWhC1MlJgPObDwRkRd8NFOopgxMcMsDIZIoLbWKhHVq67hdbwpAq9K9WMmEhP
nPwIDAQAB
-----END PUBLIC KEY-----`,
};

const STATUS = {
  TBC: {
    SUCCEEDED: 'Succeeded',
    FAILED: 'Failed',
    PROCESSING: 'Processing',
  },
  BOG: {
    COMPLETED: 'completed',
    REJECTED: 'rejected',
    PROCESSING: 'processing',
  },
};

module.exports = { CURRENCY, TBC, BOG, STATUS };
