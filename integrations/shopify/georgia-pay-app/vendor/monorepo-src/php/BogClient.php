<?php

declare(strict_types=1);

namespace FintechPay;

final class BogClient
{
    private string $clientId;
    private string $clientSecret;
    private string $baseUrl;
    private string $oauthUrl;
    private ?string $token = null;
    private int $tokenExpiresAt = 0;

    public function __construct(array $config = [])
    {
        $this->clientId = $config['clientId'] ?? getenv('BOG_CLIENT_ID') ?: '';
        $this->clientSecret = $config['clientSecret'] ?? getenv('BOG_CLIENT_SECRET') ?: '';
        $this->baseUrl = rtrim($config['baseUrl'] ?? getenv('BOG_API_BASE_URL') ?: Constants::BOG_BASE_URL, '/');
        $this->oauthUrl = $config['oauthUrl'] ?? getenv('BOG_OAUTH_URL') ?: Constants::BOG_OAUTH_URL;
    }

    /** @return array<string, mixed> */
    public function createOrder(array $params): array
    {
        $basket = $params['basket'] ?? [[
            'product_id' => $params['externalOrderId'] ?? 'item-1',
            'quantity' => 1,
            'unit_price' => $params['amount'],
        ]];

        $payload = [
            'callback_url' => $params['callbackUrl'],
            'external_order_id' => $params['externalOrderId'] ?? null,
            'purchase_units' => [
                'currency' => Constants::CURRENCY_CODE,
                'total_amount' => $params['amount'],
                'basket' => $basket,
            ],
            'redirect_urls' => [
                'success' => $params['successUrl'],
                'fail' => $params['failUrl'],
            ],
        ];

        $extraHeaders = [];
        if (!empty($params['idempotencyKey'])) {
            $extraHeaders[] = 'Idempotency-Key: ' . $params['idempotencyKey'];
        }
        if (!empty($params['language'])) {
            $extraHeaders[] = 'Accept-Language: ' . $params['language'];
        }

        return $this->request('POST', '/ecommerce/orders', $payload, $extraHeaders);
    }

    /** @return array<string, mixed> */
    public function getOrder(string $orderId): array
    {
        return $this->request('GET', '/receipt/' . rawurlencode($orderId));
    }

    public static function getRedirectUrl(array $response): ?string
    {
        return $response['_links']['redirect']['href'] ?? null;
    }

    /**
     * @param list<string> $extraHeaders
     * @return array<string, mixed>
     */
    private function request(string $method, string $path, ?array $body = null, array $extraHeaders = []): array
    {
        $token = $this->getAccessToken();
        $url = $this->baseUrl . $path;

        $headers = array_merge([
            'Authorization: Bearer ' . $token,
            'Accept: application/json',
        ], $extraHeaders);

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
            throw new \RuntimeException("BOG API error ({$status}): {$response}");
        }

        return is_array($data) ? $data : [];
    }

    private function getAccessToken(): string
    {
        if ($this->token !== null && time() < $this->tokenExpiresAt - 60) {
            return $this->token;
        }

        $credentials = base64_encode($this->clientId . ':' . $this->clientSecret);
        $body = http_build_query(['grant_type' => 'client_credentials']);

        $ch = curl_init($this->oauthUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/x-www-form-urlencoded',
                'Authorization: Basic ' . $credentials,
            ],
        ]);

        $response = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode((string) $response, true);
        if ($status < 200 || $status >= 300 || !is_array($data)) {
            throw new \RuntimeException("BOG token request failed ({$status}): {$response}");
        }

        $this->token = (string) ($data['access_token'] ?? '');
        $expiresIn = (int) ($data['expires_in'] ?? 3600);
        if ($expiresIn > 86400) {
            $expiresIn = 3600;
        }
        $this->tokenExpiresAt = time() + $expiresIn;

        return $this->token;
    }
}
