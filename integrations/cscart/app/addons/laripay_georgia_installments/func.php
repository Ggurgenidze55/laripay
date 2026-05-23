<?php
/**
 * CS-Cart addon — LariPay.ai online installments (bank-hosted pay-in-parts).
 */

if (!defined('BOOTSTRAP')) { die('Access denied'); }

use Tygh\Registry;

function fn_laripay_georgia_installments_get_client()
{
    $api_url = Registry::get('addons.laripay_georgia_installments.api_url');
    $secret  = Registry::get('addons.laripay_georgia_installments.secret_key');
    if (!$api_url || !$secret) {
        return null;
    }
    require_once dirname(__DIR__, 4) . '/shared/laripay-client.php';
    if (!defined('LARIPAY_CLIENT_STANDALONE')) {
        define('LARIPAY_CLIENT_STANDALONE', true);
    }
    return new LariPay_Client($api_url, $secret, 'cscart', Registry::get('config.http_location'));
}

function fn_laripay_georgia_installments_process_payment($order_info, $processor_data)
{
    $client = fn_laripay_georgia_installments_get_client();
    if (!$client) {
        return [CONTROLLER_STATUS_REDIRECT, 'checkout.checkout?payment_error=laripay_installments'];
    }

    $provider = Registry::get('addons.laripay_georgia_installments.bank') ?: 'tbc';
    $terms    = Registry::get('addons.laripay_georgia_installments.installment_terms');
    $success  = fn_url('payment_notification.success?payment=laripay_georgia_installments&order_id=' . $order_info['order_id'], 'C');
    $cancel   = fn_url('checkout.cart', 'C');

    try {
        $session = $client->create_installment_checkout_session(
            (float) $order_info['total'],
            $success,
            $cancel,
            (string) $order_info['order_id'],
            $provider,
            $terms ? (int) $terms : null,
            ['integration' => 'cscart']
        );
        return [CONTROLLER_STATUS_REDIRECT, $session['url'], true];
    } catch (Exception $e) {
        fn_set_notification('E', __('error'), $e->getMessage());
        return [CONTROLLER_STATUS_REDIRECT, 'checkout.checkout?payment_error=laripay_installments'];
    }
}
