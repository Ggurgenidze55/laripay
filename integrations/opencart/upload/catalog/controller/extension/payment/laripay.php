<?php
/**
 * OpenCart 3.x payment extension — LariPay.ai Georgian banks.
 *
 * Upload `upload/` contents to OpenCart root.
 */
class ControllerExtensionPaymentLaripay extends Controller {
    public function index() {
        $this->load->language('extension/payment/laripay');
        $this->load->model('setting/setting');
        $this->load->model('extension/payment/laripay');

        if (($this->request->server['REQUEST_METHOD'] == 'POST') && $this->validate()) {
            $this->model_setting_setting->editSetting('payment_laripay', $this->request->post);
            $this->session->data['success'] = $this->language->get('text_success');
            $this->response->redirect($this->url->link('marketplace/extension', 'user_token=' . $this->session->data['user_token'] . '&type=payment', true));
        }

        $data['action'] = $this->url->link('extension/payment/laripay', 'user_token=' . $this->session->data['user_token'], true);
        $data['cancel'] = $this->url->link('marketplace/extension', 'user_token=' . $this->session->data['user_token'] . '&type=payment', true);

        $fields = ['payment_laripay_status', 'payment_laripay_api_url', 'payment_laripay_secret_key', 'payment_laripay_bank'];
        foreach ($fields as $field) {
            $data[$field] = isset($this->request->post[$field]) ? $this->request->post[$field] : $this->config->get($field);
        }

        $data['banks'] = [
            'tbc' => 'TBC Pay', 'bog' => 'BOG Pay', 'liberty' => 'Liberty Bank',
            'credo' => 'Credo Bank', 'cartu' => 'Cartu Bank', 'basis' => 'Basis Bank', 'flitt' => 'Flitt',
        ];

        $data['header'] = $this->load->controller('common/header');
        $data['column_left'] = $this->load->controller('common/column_left');
        $data['footer'] = $this->load->controller('common/footer');
        $this->response->setOutput($this->load->view('extension/payment/laripay', $data));
    }

    protected function validate() {
        return $this->user->hasPermission('modify', 'extension/payment/laripay');
    }
}

class ControllerExtensionPaymentLaripayConfirm extends Controller {
    public function index() {
        $this->load->model('checkout/order');
        $this->load->model('extension/payment/laripay');
        $order_id = $this->session->data['order_id'];
        $order = $this->model_checkout_order->getOrder($order_id);
        $json = $this->model_extension_payment_laripay->createSession($order);
        $this->response->addHeader('Content-Type: application/json');
        $this->response->setOutput(json_encode($json));
    }
}
