<?php
class ModelExtensionPaymentLaripay extends Model {
    public function getMethod($address, $total) {
        if (!$this->config->get('payment_laripay_status')) {
            return [];
        }
        return [
            'code'       => 'laripay',
            'title'      => $this->language->get('text_title'),
            'terms'      => '',
            'sort_order' => $this->config->get('payment_laripay_sort_order'),
        ];
    }

    public function createSession($order) {
        require_once DIR_SYSTEM . '../../shared/laripay-client.php';
        if (!defined('LARIPAY_CLIENT_STANDALONE')) {
            define('LARIPAY_CLIENT_STANDALONE', true);
        }

        $client = new LariPay_Client(
            $this->config->get('payment_laripay_api_url'),
            $this->config->get('payment_laripay_secret_key'),
            'opencart',
            HTTP_SERVER
        );

        $provider = $this->config->get('payment_laripay_bank') ?: 'tbc';
        $success  = $this->url->link('checkout/success', '', true);
        $cancel   = $this->url->link('checkout/cart', '', true);

        try {
            $session = $client->create_checkout_session(
                (float) $order['total'],
                $success,
                $cancel,
                (string) $order['order_id'],
                $provider,
                ['integration' => 'opencart']
            );
            return ['redirect' => $session['url']];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
}
