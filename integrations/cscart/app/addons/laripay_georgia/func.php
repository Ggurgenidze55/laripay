<?php
/**
 * CS-Cart addon — LariPay.ai Georgian bank card payments (bank-hosted redirect).
 *
 * Install: copy `app/addons/laripay_georgia` to `app/addons/` in CS-Cart root.
 */

if (!defined('BOOTSTRAP')) { die('Access denied'); }

use Tygh\Registry;

function fn_laripay_georgia_get_client()
{
    $api_url = Registry::get('addons.laripay_georgia.api_url');
    $secret  = Registry::get('addons.laripay_georgia.secret_key');
    if (!$api_url || !$secret) {
        return null;
    }
    require_once dirname(__DIR__, 4) . '/shared/laripay-client.php';
    if (!defined('LARIPAY_CLIENT_STANDALONE')) {
        define('LARIPAY_CLIENT_STANDALONE', true);
    }
    return new LariPay_Client($api_url, $secret, 'cscart', Registry::get('config.http_location'));
}

function fn_laripay_georgia_process_payment($order_info, $processor_data)
{
    $client = fn_laripay_georgia_get_client();
    if (!$client) {
        return [CONTROLLER_STATUS_REDIRECT, 'checkout.checkout?payment_error=laripay'];
    }

    $provider = Registry::get('addons.laripay_georgia.bank') ?: 'tbc';
    $success  = fn_url('payment_notification.success?payment=laripay_georgia&order_id=' . $order_info['order_id'], 'C');
    $cancel   = fn_url('checkout.cart', 'C');

    try {
        $session = $client->create_checkout_session(
            (float) $order_info['total'],
            $success,
            $cancel,
            (string) $order_info['order_id'],
            $provider,
            ['integration' => 'cscart']
        );
        db_query('UPDATE ?:orders SET payment_info = ?s WHERE order_id = ?i', serialize(['laripay_session' => $session['id']]), $order_info['order_id']);
        return [CONTROLLER_STATUS_REDIRECT, $session['url'], true];
    } catch (Exception $e) {
        fn_set_notification('E', __('error'), $e->getMessage());
        return [CONTROLLER_STATUS_REDIRECT, 'checkout.checkout?payment_error=laripay'];
    }
}

function fn_laripay_georgia_install()
{
    // Payment processor registration handled via addon.xml payment_methods.
}

function fn_laripay_georgia_uninstall()
{
}
