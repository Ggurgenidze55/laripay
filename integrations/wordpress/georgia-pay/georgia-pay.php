<?php
/**
 * Plugin Name: LariPay.ai — Georgia Pay (TBC & BOG)
 * Plugin URI:  https://laripay.ai
 * Description: WooCommerce payments in GEL via LariPay.ai REST API (TBC Pay & BOG Pay). Configure API URL + sk_test_ key from laripay.ai/onboard.
 * Version:     1.0.0
 * Author:      Fintech Pay
 * Text Domain: georgia-pay
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 * WC tested up to: 9.0
 *
 * @package GeorgiaPay
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'GEORGIA_PAY_VERSION', '1.0.0' );
define( 'GEORGIA_PAY_FILE', __FILE__ );
define( 'GEORGIA_PAY_PATH', plugin_dir_path( __FILE__ ) );
define( 'GEORGIA_PAY_URL', plugin_dir_url( __FILE__ ) );

require_once GEORGIA_PAY_PATH . 'includes/class-georgia-pay-constants.php';
require_once GEORGIA_PAY_PATH . 'includes/class-georgia-pay-laripay-client.php';
require_once GEORGIA_PAY_PATH . 'includes/class-georgia-pay-laripay-webhook.php';

/**
 * Bootstrap plugin after WooCommerce loads.
 */
function georgia_pay_init() {
	if ( ! class_exists( 'WooCommerce' ) || ! class_exists( 'WC_Payment_Gateway' ) ) {
		add_action(
			'admin_notices',
			function () {
				echo '<div class="notice notice-error"><p>';
				echo esc_html__( 'Georgia Pay requires WooCommerce to be installed and active.', 'georgia-pay' );
				echo '</p></div>';
			}
		);
		return;
	}

	require_once GEORGIA_PAY_PATH . 'includes/class-wc-georgia-pay-gateway.php';
	Georgia_Pay_LariPay_Webhook::register_routes();

	add_filter(
		'woocommerce_payment_gateways',
		function ( $gateways ) {
			$gateways[] = 'WC_Georgia_Pay_Gateway';
			return $gateways;
		}
	);
}
add_action( 'plugins_loaded', 'georgia_pay_init', 11 );

/**
 * Declare HPOS compatibility.
 */
add_action(
	'before_woocommerce_init',
	function () {
		if ( class_exists( '\Automattic\WooCommerce\Utilities\FeaturesUtil' ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
				'custom_order_tables',
				GEORGIA_PAY_FILE,
				true
			);
		}
	}
);

/**
 * Register GEL if missing.
 *
 * @param array $currencies Currencies.
 * @return array
 */
function georgia_pay_register_gel( $currencies ) {
	$currencies['GEL'] = __( 'Georgian Lari', 'georgia-pay' );
	return $currencies;
}
add_filter( 'woocommerce_currencies', 'georgia_pay_register_gel' );

/**
 * GEL currency symbol.
 *
 * @param string $symbol   Symbol.
 * @param string $currency Currency code.
 * @return string
 */
function georgia_pay_currency_symbol( $symbol, $currency ) {
	if ( 'GEL' === $currency ) {
		return '₾';
	}
	return $symbol;
}
add_filter( 'woocommerce_currency_symbol', 'georgia_pay_currency_symbol', 10, 2 );
