<?php
/**
 * Standalone validation test for the Georgia Pay WooCommerce plugin.
 * Run: php test-plugin.php
 */

$pass = 0;
$fail = 0;

function test($label, $result) {
    global $pass, $fail;
    if ($result) {
        echo "  PASS: $label\n";
        $pass++;
    } else {
        echo "  FAIL: $label\n";
        $fail++;
    }
}

echo "\n=== Georgia Pay Plugin Validation ===\n\n";

$plugin_dir = __DIR__ . '/georgia-pay';

// 1. File structure
echo "[File Structure]\n";
$required_files = [
    'georgia-pay.php',
    'readme.txt',
    'includes/class-wc-georgia-pay-gateway.php',
    'includes/class-wc-georgia-pay-installments-gateway.php',
    'includes/class-georgia-pay-laripay-client.php',
    'includes/class-georgia-pay-laripay-webhook.php',
    'includes/class-georgia-pay-return-handler.php',
    'includes/class-georgia-pay-banks.php',
    'includes/class-georgia-pay-constants.php',
    'assets/css/admin.css',
    'assets/css/checkout.css',
    'languages/georgia-pay-ka_GE.po',
];
foreach ($required_files as $f) {
    test("File exists: $f", file_exists("$plugin_dir/$f"));
}

// 2. PHP syntax
echo "\n[PHP Syntax]\n";
$php_files = glob("$plugin_dir/{,includes/}*.php", GLOB_BRACE);
foreach ($php_files as $file) {
    $output = [];
    $code = 0;
    exec("php -l " . escapeshellarg($file) . " 2>&1", $output, $code);
    $basename = basename($file);
    test("Syntax OK: $basename", $code === 0);
}

// 3. Plugin header
echo "\n[Plugin Header]\n";
$main = file_get_contents("$plugin_dir/georgia-pay.php");
test("Plugin Name defined", strpos($main, 'Plugin Name:') !== false);
test("Plugin Name is LariPay", strpos($main, 'LariPay.ai') !== false);
test("Version defined", strpos($main, "GEORGIA_PAY_VERSION") !== false);
test("Text domain: georgia-pay", strpos($main, "Text Domain: georgia-pay") !== false);
test("ABSPATH check", strpos($main, "ABSPATH") !== false);
test("WooCommerce dependency check", strpos($main, "class_exists( 'WooCommerce' )") !== false);
test("HPOS compatibility declared", strpos($main, "custom_order_tables") !== false);
test("GEL currency registration", strpos($main, "woocommerce_currencies") !== false);
test("Translations loaded", strpos($main, "load_plugin_textdomain") !== false);
test("Admin CSS enqueued", strpos($main, "admin.css") !== false);
test("Checkout CSS enqueued", strpos($main, "checkout.css") !== false);
test("Plugin action links", strpos($main, "plugin_action_links") !== false);

// 4. Gateway class
echo "\n[Gateway Class]\n";
$gw = file_get_contents("$plugin_dir/includes/class-wc-georgia-pay-gateway.php");
test("Extends WC_Payment_Gateway", strpos($gw, "extends WC_Payment_Gateway") !== false);
test("Gateway ID: georgia_pay", strpos($gw, "'georgia_pay'") !== false);
test("init_form_fields defined", strpos($gw, "function init_form_fields") !== false);
test("process_payment defined", strpos($gw, "function process_payment") !== false);
test("handle_return defined", strpos($gw, "function handle_return") !== false);
test("is_available checks", strpos($gw, "function is_available") !== false);
test("LariPay client used", strpos($gw, "get_laripay_client") !== false);
test("Checkout icon HTML", strpos($gw, "get_checkout_icon_html") !== false);
test("payment_fields with secure note", strpos($gw, "georgia-pay-secure-note") !== false);
test("admin_options with header", strpos($gw, "laripay-admin-header") !== false);
test("API URL setting", strpos($gw, "laripay_api_url") !== false);
test("Secret key setting", strpos($gw, "laripay_secret_key") !== false);
test("Webhook secret setting", strpos($gw, "laripay_webhook_secret") !== false);
test("Bank selector", strpos($gw, "georgia_pay_bank_options") !== false);
test("Return URL handling", strpos($gw, "get_return_url") !== false);
test("Cart emptied after payment", strpos($gw, "empty_cart") !== false);
test("Session ID saved as meta", strpos($gw, "_laripay_session_id") !== false);
test("Bank picker on checkout", strpos($gw, "georgia-pay-bank-picker") !== false);
test("Resolves checkout bank", strpos($gw, "resolve_checkout_bank") !== false);

// 5. Installments gateway
echo "\n[Installments Gateway]\n";
$inst = file_get_contents("$plugin_dir/includes/class-wc-georgia-pay-installments-gateway.php");
test("Extends base gateway", strpos($inst, "extends WC_Georgia_Pay_Gateway") !== false);
test("Installment terms selector", strpos($inst, "installment_terms") !== false);
test("Uses installment API", strpos($inst, "create_installment_checkout_session") !== false);

// 6. API client
echo "\n[API Client]\n";
$client = file_get_contents("$plugin_dir/includes/class-georgia-pay-laripay-client.php");
test("Creates checkout sessions", strpos($client, "create_checkout_session") !== false);
test("Gets checkout sessions", strpos($client, "get_checkout_session") !== false);
test("Registers webhooks", strpos($client, "register_webhook_endpoint") !== false);
test("Bearer auth header", strpos($client, "Authorization") !== false);
test("Integration header", strpos($client, "X-LariPay-Integration") !== false);
test("Uses wp_remote_request", strpos($client, "wp_remote_request") !== false);
test("JSON encoding", strpos($client, "wp_json_encode") !== false);

// 7. Webhook handler
echo "\n[Webhook Handler]\n";
$webhook = file_get_contents("$plugin_dir/includes/class-georgia-pay-laripay-webhook.php");
test("Handles payment.succeeded", strpos($webhook, "payment.succeeded") !== false);
test("Handles payment.failed", strpos($webhook, "payment.failed") !== false);
test("HMAC signature verification", strpos($webhook, "hash_hmac") !== false);
test("Calls mark_paid helper", strpos($webhook, "mark_paid") !== false);
test("Calls mark_failed helper", strpos($webhook, "mark_failed") !== false);
test("WC API route registered", strpos($webhook, "woocommerce_api_georgia_pay_laripay") !== false);

// 7b. Return handler
echo "\n[Return Handler]\n";
$return = file_get_contents("$plugin_dir/includes/class-georgia-pay-return-handler.php");
test("Return handler class exists", strpos($return, "class Georgia_Pay_Return_Handler") !== false);
test("Processes laripay query param", strpos($return, "laripay") !== false);
test("Marks order paid", strpos($return, "mark_paid") !== false);
test("Marks order failed", strpos($return, "mark_failed") !== false);
test("Sets completed status", strpos($return, "woocommerce_payment_complete_order_status") !== false);
test("Renders success/failed notice", strpos($return, "georgia-pay-result") !== false);

// 8. CSS files
echo "\n[CSS Assets]\n";
$adminCss = file_get_contents("$plugin_dir/assets/css/admin.css");
$checkoutCss = file_get_contents("$plugin_dir/assets/css/checkout.css");
test("Admin CSS has LariPay header style", strpos($adminCss, "laripay-admin-header") !== false);
test("Admin CSS has purple gradient", strpos($adminCss, "#8b5cf6") !== false);
test("Admin CSS has dark background", strpos($adminCss, "#0f172a") !== false);
test("Checkout CSS has secure note", strpos($checkoutCss, "georgia-pay-secure-note") !== false);
test("Checkout CSS has icon styling", strpos($checkoutCss, "georgia-pay-icon-inline") !== false);
test("Checkout CSS has result banner", strpos($checkoutCss, "georgia-pay-result--success") !== false);
test("Checkout CSS has bank picker", strpos($checkoutCss, "georgia-pay-bank-picker") !== false);

// 9. i18n
echo "\n[Internationalization]\n";
$po = file_get_contents("$plugin_dir/languages/georgia-pay-ka_GE.po");
test("Georgian translation file exists", strlen($po) > 100);
test("Contains Georgian text", strpos($po, "ქართული") !== false);
test("Contains GEL symbol", strpos($po, "₾") !== false);
test("Bank names translated", strpos($po, "თიბისი") !== false);

// 10. Banks
echo "\n[Bank Configuration]\n";
$banks = file_get_contents("$plugin_dir/includes/class-georgia-pay-banks.php");
test("TBC bank option", strpos($banks, "'tbc'") !== false);
test("BOG bank option", strpos($banks, "'bog'") !== false);
test("Liberty bank option", strpos($banks, "'liberty'") !== false);
test("Credo bank option", strpos($banks, "'credo'") !== false);
test("Cartu bank option", strpos($banks, "'cartu'") !== false);
test("Basis bank option", strpos($banks, "'basis'") !== false);
test("Flitt bank option", strpos($banks, "'flitt'") !== false);

echo "\n=== Results: $pass passed, $fail failed ===\n";

if ($fail > 0) {
    exit(1);
}
echo "All tests passed!\n\n";
