<?php

declare(strict_types=1);

namespace FintechPay;

final class WebhookVerifier
{
    private const TBC_SIGNATURE_HEADERS = [
        'Callback-Signature',
        'X-TBC-Signature',
        'X-Signature',
    ];

    /**
     * Verify TBC Pay callback (IP allowlist + optional HMAC-SHA256).
     *
     * @return array{valid: bool, paymentId?: string|null, error?: string, payload?: mixed, verifiedBy?: string}
     */
    public static function verifyTbc(string $rawBody, array $options = []): array
    {
        $headers = $options['headers'] ?? [];
        $secret = $options['secret'] ?? getenv('TBC_WEBHOOK_SECRET') ?: getenv('TBC_CLIENT_SECRET') ?: '';
        $clientIp = $options['clientIp'] ?? '';
        $skipIpCheck = $options['skipIpCheck'] ?? false;

        if (!$skipIpCheck && $clientIp !== '' && !in_array($clientIp, Constants::TBC_CALLBACK_IPS, true)) {
            return ['valid' => false, 'error' => 'Invalid source IP', 'paymentId' => null];
        }

        $signature = self::getHeader($headers, self::TBC_SIGNATURE_HEADERS);

        if ($signature !== '') {
            if ($secret === '') {
                return ['valid' => false, 'error' => 'Signature present but TBC_WEBHOOK_SECRET not configured', 'paymentId' => null];
            }

            $expected = hash_hmac('sha256', $rawBody, $secret);
            $received = preg_replace('/^sha256=/i', '', $signature) ?? $signature;

            if (!hash_equals($expected, $received)) {
                return ['valid' => false, 'error' => 'Invalid HMAC signature', 'paymentId' => null];
            }
        }

        $payload = json_decode($rawBody, true);
        if (!is_array($payload)) {
            return ['valid' => false, 'error' => 'Invalid JSON body', 'paymentId' => null];
        }

        $paymentId = $payload['PaymentId'] ?? $payload['paymentId'] ?? $payload['payId'] ?? null;
        if ($paymentId === null || $paymentId === '') {
            return ['valid' => false, 'error' => 'Missing PaymentId in callback body', 'paymentId' => null];
        }

        return [
            'valid' => true,
            'paymentId' => (string) $paymentId,
            'verifiedBy' => $signature !== '' ? 'hmac_and_ip' : 'ip_allowlist',
            'payload' => $payload,
        ];
    }

    /**
     * Verify BOG Pay callback (RSA SHA256withRSA via Callback-Signature header).
     *
     * @return array{valid: bool, payload?: mixed, orderId?: string|null, event?: string|null, error?: string}
     */
    public static function verifyBog(string $rawBody, array $options = []): array
    {
        $headers = $options['headers'] ?? [];
        $publicKey = $options['publicKey']
            ?? getenv('BOG_CALLBACK_PUBLIC_KEY')
            ?: Constants::BOG_DEFAULT_PUBLIC_KEY;

        $signature = self::getHeader($headers, ['Callback-Signature']);
        if ($signature === '') {
            return ['valid' => false, 'error' => 'Missing Callback-Signature header', 'payload' => null];
        }

        $verified = openssl_verify(
            $rawBody,
            base64_decode($signature, true) ?: '',
            $publicKey,
            OPENSSL_ALGO_SHA256
        );

        if ($verified !== 1) {
            return ['valid' => false, 'error' => 'Invalid RSA signature', 'payload' => null];
        }

        $payload = json_decode($rawBody, true);
        if (!is_array($payload)) {
            return ['valid' => false, 'error' => 'Invalid JSON body', 'payload' => null];
        }

        return [
            'valid' => true,
            'payload' => $payload,
            'orderId' => $payload['body']['order_id'] ?? null,
            'event' => $payload['event'] ?? null,
        ];
    }

    public static function verify(string $provider, string $rawBody, array $options = []): array
    {
        return match ($provider) {
            'tbc' => self::verifyTbc($rawBody, $options),
            'bog' => self::verifyBog($rawBody, $options),
            default => throw new \InvalidArgumentException("Unknown provider: {$provider}. Use \"tbc\" or \"bog\"."),
        };
    }

    /** @param list<string> $names */
    private static function getHeader(array $headers, array $names): string
    {
        $normalized = [];
        foreach ($headers as $key => $value) {
            $normalized[strtolower((string) $key)] = is_array($value) ? ($value[0] ?? '') : (string) $value;
        }

        foreach ($names as $name) {
            $lower = strtolower($name);
            if (isset($normalized[$lower]) && $normalized[$lower] !== '') {
                return $normalized[$lower];
            }
        }

        return '';
    }
}
