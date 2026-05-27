<?php
/**
 * Plugin Name: LariPay.ai — Georgia Pay (Georgian banks)
 * Plugin URI:  https://laripay.ai
 * Description: WooCommerce payments in GEL via LariPay.ai (TBC, BOG, Liberty, Credo, Cartu, Basis, Flitt). Bank-hosted card checkout.
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
require_once GEORGIA_PAY_PATH . 'includes/class-georgia-pay-banks.php';
require_once GEORGIA_PAY_PATH . 'includes/class-georgia-pay-laripay-client.php';
require_once GEORGIA_PAY_PATH . 'includes/class-georgia-pay-laripay-webhook.php';
require_once GEORGIA_PAY_PATH . 'includes/class-georgia-pay-blocks-support.php';

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
	require_once GEORGIA_PAY_PATH . 'includes/class-wc-georgia-pay-installments-gateway.php';
	Georgia_Pay_LariPay_Webhook::register_routes();

	add_filter(
		'woocommerce_payment_gateways',
		function ( $gateways ) {
			$gateways[] = 'WC_Georgia_Pay_Gateway';
			$gateways[] = 'WC_Georgia_Pay_Installments_Gateway';
			return $gateways;
		}
	);
}
add_action( 'plugins_loaded', 'georgia_pay_init', 11 );

/**
 * Auto-configure sensible defaults on activation.
 */
function georgia_pay_activate() {
	$settings = get_option( 'woocommerce_georgia_pay_settings', array() );
	if ( ! is_array( $settings ) ) {
		$settings = array();
	}

	if ( empty( $settings['laripay_api_url'] ) ) {
		$settings['laripay_api_url'] = 'https://laripay.vercel.app';
	}
	if ( empty( $settings['title'] ) ) {
		$settings['title'] = __( 'Pay with card (GEL)', 'georgia-pay' );
	}
	if ( empty( $settings['description'] ) ) {
		$settings['description'] = __( 'Secure payment via Georgian banks (LariPay.ai).', 'georgia-pay' );
	}
	if ( empty( $settings['bank'] ) ) {
		$settings['bank'] = 'tbc';
	}
	if ( empty( $settings['enabled'] ) ) {
		$settings['enabled'] = 'yes';
	}

	update_option( 'woocommerce_georgia_pay_settings', $settings );

	// Keep onboarding friction low: default to GEL for this gateway.
	if ( 'GEL' !== get_option( 'woocommerce_currency' ) ) {
		update_option( 'woocommerce_currency', 'GEL' );
	}
}
register_activation_hook( GEORGIA_PAY_FILE, 'georgia_pay_activate' );

/**
 * Register gateway for WooCommerce Blocks checkout.
 */
function georgia_pay_blocks_support() {
	if ( ! class_exists( 'Automattic\\WooCommerce\\Blocks\\Payments\\Integrations\\AbstractPaymentMethodType' ) ) {
		return;
	}

	add_action(
		'woocommerce_blocks_payment_method_type_registration',
		function ( $payment_method_registry ) {
			$payment_method_registry->register( new Georgia_Pay_Blocks_Support() );
		}
	);
}
add_action( 'woocommerce_blocks_loaded', 'georgia_pay_blocks_support' );

/**
 * Load translations.
 */
function georgia_pay_load_textdomain() {
	load_plugin_textdomain( 'georgia-pay', false, dirname( plugin_basename( GEORGIA_PAY_FILE ) ) . '/languages/' );
}
add_action( 'init', 'georgia_pay_load_textdomain' );

/**
 * Enqueue admin CSS on WooCommerce settings pages.
 *
 * @param string $hook Page hook.
 */
function georgia_pay_admin_assets( $hook ) {
	if ( 'woocommerce_page_wc-settings' !== $hook ) {
		return;
	}
	wp_enqueue_style(
		'georgia-pay-admin',
		GEORGIA_PAY_URL . 'assets/css/admin.css',
		array(),
		GEORGIA_PAY_VERSION
	);
}
add_action( 'admin_enqueue_scripts', 'georgia_pay_admin_assets' );

/**
 * Enqueue checkout CSS on frontend.
 */
function georgia_pay_checkout_assets() {
	if ( ! is_checkout() && ! is_cart() ) {
		return;
	}
	wp_enqueue_style(
		'georgia-pay-checkout',
		GEORGIA_PAY_URL . 'assets/css/checkout.css',
		array(),
		GEORGIA_PAY_VERSION
	);
}
add_action( 'wp_enqueue_scripts', 'georgia_pay_checkout_assets' );

/**
 * Plugin action links.
 *
 * @param array $links Links.
 * @return array
 */
function georgia_pay_action_links( $links ) {
	$settings_url = admin_url( 'admin.php?page=wc-settings&tab=checkout&section=georgia_pay' );
	array_unshift(
		$links,
		'<a href="' . esc_url( $settings_url ) . '">' . esc_html__( 'Settings', 'georgia-pay' ) . '</a>'
	);
	return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( GEORGIA_PAY_FILE ), 'georgia_pay_action_links' );

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
