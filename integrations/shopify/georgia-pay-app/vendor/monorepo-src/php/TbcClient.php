<?php

declare(strict_types=1);

namespace FintechPay;

final class TbcClient
{
    private string $apiKey;
    private string $clientId;
    private string $clientSecret;
    private string $baseUrl;
    private ?string $token = null;
    private int $tokenExpiresAt = 0;

    public function __construct(array $config = [])
    {
        $this->apiKey = $config['apiKey'] ?? getenv('TBC_API_KEY') ?: '';
        $this->clientId = $config['clientId'] ?? getenv('TBC_CLIENT_ID') ?: '';
        $this->clientSecret = $config['clientSecret'] ?? getenv('TBC_CLIENT_SECRET') ?: '';
        $this->baseUrl = rtrim($config['baseUrl'] ?? getenv('TBC_API_BASE_URL') ?: Constants::TBC_BASE_URL, '/');
    }

    /** @return array<string, mixed> */
    public function createPayment(array $params): array
    {
        $payload = [
            'amount' => [
                'currency' => Constants::CURRENCY_CODE,
                'total' => $params['amount'],
            ],
            'returnurl' => $params['returnUrl'],
            'language' => $params['language'] ?? 'EN',
            'preAuth' => $params['preAuth'] ?? false,
        ];

        if (!empty($params['callbackUrl'])) {
            $payload['callbackUrl'] = $params['callbackUrl'];
        }
        if (!empty($params['merchantPaymentId'])) {
            $payload['merchantPaymentId'] = $params['merchantPaymentId'];
        }
        if (!empty($params['description'])) {
            $payload['description'] = $params['description'];
        }

        return $this->request('POST', '/tpay/payments', $payload);
    }

    /** @return array<string, mixed> */
    public function getPayment(string $payId): array
    {
        return $this->request('GET', '/tpay/payments/' . rawurlencode($payId));
    }

    /** @return array<string, mixed> */
    public function cancelPayment(string $payId): array
    {
        return $this->request('POST', '/tpay/payments/' . rawurlencode($payId) . '/cancel');
    }

    public static function getRedirectUrl(array $response): ?string
    {
        foreach ($response['links'] ?? [] as $link) {
            if (($link['rel'] ?? '') === 'approval_url') {
                return $link['uri'] ?? null;
            }
        }

        return null;
    }

    /** @return array<string, mixed> */
    private function request(string $method, string $path, ?array $body = null): array
    {
        $token = $this->getAccessToken();
        $url = $this->baseUrl . $path;

        $headers = [
            'apikey: ' . $this->apiKey,
            'Authorization: Bearer ' . $token,
            'Accept: application/json',
        ];

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $body !== null
                ? array_merge($headers, ['Content-Type: application/json'])
                : $headers,
        ]);

        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_THROW_ON_ERROR));
        }

        $response = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode((string) $response, true) ?? [];

        if ($status < 200 || $status >= 300) {
            $message = $data['developerMessage'] ?? $data['userMessage'] ?? (string) $response;
            throw new \RuntimeException("TBC API error ({$status}): {$message}");
        }

        return is_array($data) ? $data : [];
    }

    private function getAccessToken(): string
    {
        if ($this->token !== null && time() < $this->tokenExpiresAt - 60) {
            return $this->token;
        }

        $url = $this->baseUrl . '/tpay/access-token';
        $body = http_build_query([
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
        ]);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/x-www-form-urlencoded',
                'apikey: ' . $this->apiKey,
            ],
        ]);

        $response = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode((string) $response, true);
        if ($status < 200 || $status >= 300 || !is_array($data)) {
            throw new \RuntimeException("TBC token request failed ({$status}): {$response}");
        }

        $this->token = (string) ($data['access_token'] ?? '');
        $this->tokenExpiresAt = time() + (int) ($data['expires_in'] ?? 86400);

        return $this->token;
    }
}
