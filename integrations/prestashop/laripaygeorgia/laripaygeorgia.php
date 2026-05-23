<?php
/**
 * PrestaShop 8.x payment module — LariPay.ai Georgian banks.
 *
 * Copy `laripaygeorgia/` to `modules/` and install from back office.
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

require_once dirname(__DIR__, 2) . '/shared/laripay-client.php';
if (!defined('LARIPAY_CLIENT_STANDALONE')) {
    define('LARIPAY_CLIENT_STANDALONE', true);
}

class LaripayGeorgia extends PaymentModule
{
    public function __construct()
    {
        $this->name = 'laripaygeorgia';
        $this->tab = 'payments_gateways';
        $this->version = '1.0.0';
        $this->author = 'LariPay.ai';
        $this->need_instance = 0;
        $this->ps_versions_compliancy = ['min' => '8.0.0', 'max' => _PS_VERSION_];
        parent::__construct();
        $this->displayName = $this->l('LariPay.ai — Georgian banks');
        $this->description = $this->l('Bank-hosted card payments (TBC, BOG, Liberty, Credo, Cartu, Basis, Flitt).');
    }

    public function install()
    {
        return parent::install()
            && $this->registerHook('paymentOptions')
            && Configuration::updateValue('LARIPAY_API_URL', 'https://laripay.ai')
            && Configuration::updateValue('LARIPAY_BANK', 'tbc');
    }

    public function getContent()
    {
        $output = '';
        if (Tools::isSubmit('submitLaripay')) {
            Configuration::updateValue('LARIPAY_API_URL', Tools::getValue('LARIPAY_API_URL'));
            Configuration::updateValue('LARIPAY_SECRET_KEY', Tools::getValue('LARIPAY_SECRET_KEY'));
            Configuration::updateValue('LARIPAY_BANK', Tools::getValue('LARIPAY_BANK'));
            $output .= $this->displayConfirmation($this->l('Settings updated'));
        }
        return $output . $this->renderForm();
    }

    protected function renderForm()
    {
        $banks = ['tbc' => 'TBC Pay', 'bog' => 'BOG Pay', 'liberty' => 'Liberty', 'credo' => 'Credo', 'cartu' => 'Cartu', 'basis' => 'Basis', 'flitt' => 'Flitt'];
        $options = '';
        foreach ($banks as $id => $label) {
            $sel = Configuration::get('LARIPAY_BANK') === $id ? ' selected' : '';
            $options .= "<option value=\"$id\"$sel>$label</option>";
        }
        return '<form method="post"><label>API URL</label><input name="LARIPAY_API_URL" value="' . htmlspecialchars(Configuration::get('LARIPAY_API_URL')) . '"><br>
            <label>Secret key</label><input type="password" name="LARIPAY_SECRET_KEY" value="' . htmlspecialchars(Configuration::get('LARIPAY_SECRET_KEY')) . '"><br>
            <label>Bank</label><select name="LARIPAY_BANK">' . $options . '</select><br>
            <button type="submit" name="submitLaripay">Save</button></form>';
    }

    public function hookPaymentOptions($params)
    {
        if (!$this->active) {
            return [];
        }
        $option = new PrestaShop\PrestaShop\Core\Payment\PaymentOption();
        $option->setModuleName($this->name);
        $option->setCallToActionText($this->l('Pay with card (GEL)'));
        $option->setAction($this->context->link->getModuleLink($this->name, 'payment'));
        return [$option];
    }
}
