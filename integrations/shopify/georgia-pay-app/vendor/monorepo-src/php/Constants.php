<?php

declare(strict_types=1);

namespace FintechPay;

final class Constants
{
    public const CURRENCY_CODE = 'GEL';
    public const CURRENCY_NUMERIC = 981;

    public const TBC_BASE_URL = 'https://api.tbcbank.ge/v1';
    public const TBC_CALLBACK_IPS = [
        '193.104.20.44',
        '193.104.20.45',
        '185.52.80.44',
        '185.52.80.45',
    ];

    public const BOG_BASE_URL = 'https://api.bog.ge/payments/v1';
    public const BOG_OAUTH_URL = 'https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token';

    public const BOG_DEFAULT_PUBLIC_KEY = <<<'PEM'
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4RUyAw3+CdkS3ZNILQh
zHI9Hemo+vKB9U2BSabppkKjzjjkf+0Sm76hSMiu/HFtYhqWOESryoCDJoqffY0Q
1VNt25aTxbj068QNUtnxQ7KQVLA+pG0smf+EBWlS1vBEAFbIas9d8c9b9sSEkTrr
TYQ90WIM8bGB6S/KLVoT1a7SnzabjoLc5Qf/SLDG5fu8dH8zckyeYKdRKSBJKvh
xtcBuHV4f7qsynQT+f2UYbESX/TLHwT5qFWZDHZ0YUOUIvb8n7JujVSGZO9/+ll/
g4ZIWhC1MlJgPObDwRkRd8NFOopgxMcMsDIZIoLbWKhHVq67hdbwpAq9K9WMmEhP
nPwIDAQAB
-----END PUBLIC KEY-----
PEM;
}
