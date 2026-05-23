<?php
/**
 * PrestaShop front controller — redirect to LariPay bank checkout.
 */
require_once dirname(__FILE__) . '/../../laripaygeorgia.php';

class LaripaygeorgiaPaymentModuleFrontController extends ModuleFrontController
{
    public function postProcess()
    {
        $cart = $this->context->cart;
        $client = new LariPay_Client(
            Configuration::get('LARIPAY_API_URL'),
            Configuration::get('LARIPAY_SECRET_KEY'),
            'prestashop',
            Tools::getShopDomainSsl(true)
        );

        $success = $this->context->link->getPageLink('order-confirmation', true);
        $cancel  = $this->context->link->getPageLink('order', true);

        try {
            $session = $client->create_checkout_session(
                (float) $cart->getOrderTotal(true, Cart::BOTH),
                $success,
                $cancel,
                (string) $cart->id,
                Configuration::get('LARIPAY_BANK') ?: 'tbc',
                ['integration' => 'prestashop']
            );
            Tools::redirect($session['url']);
        } catch (Exception $e) {
            $this->errors[] = $e->getMessage();
            Tools::redirect('index.php?controller=order');
        }
    }
}
