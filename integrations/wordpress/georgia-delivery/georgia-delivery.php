<?php
/**
 * Plugin Name: LariPay.ai — Georgia Delivery (Couriers)
 * Plugin URI:  https://laripay.ai
 * Description: WooCommerce shipping rates & shipments via LariPay.ai — Delivo, OnWay, Georgian Post, Glovo, Wolt, Bolt, KiwiPost, DHL and more.
 * Version:     1.0.0
 * Author:      Fintech Pay
 * Text Domain: georgia-delivery
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 *
 * @package GeorgiaDelivery
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'GEORGIA_DELIVERY_VERSION', '1.0.0' );
define( 'GEORGIA_DELIVERY_PATH', plugin_dir_path( __FILE__ ) );

require_once GEORGIA_DELIVERY_PATH . 'includes/class-georgia-delivery-carriers.php';
require_once GEORGIA_DELIVERY_PATH . 'includes/class-georgia-delivery-client.php';
require_once GEORGIA_DELIVERY_PATH . 'includes/class-wc-georgia-delivery-shipping.php';

function georgia_delivery_init() {
	if ( ! class_exists( 'WooCommerce' ) ) {
		return;
	}

	add_filter(
		'woocommerce_shipping_methods',
		function ( $methods ) {
			$methods['georgia_delivery'] = 'WC_Georgia_Delivery_Shipping';
			return $methods;
		}
	);
}
add_action( 'plugins_loaded', 'georgia_delivery_init', 11 );

add_action(
	'woocommerce_order_status_processing',
	function ( $order_id ) {
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return;
		}
		if ( $order->get_meta( '_laripay_delivery_shipment_id' ) ) {
			return;
		}

		$uses_delivery = false;
		foreach ( $order->get_shipping_methods() as $line ) {
			if ( strpos( $line->get_method_id(), 'georgia_delivery' ) === 0 ) {
				$uses_delivery = true;
				break;
			}
		}
		if ( ! $uses_delivery ) {
			return;
		}

		$method = new WC_Georgia_Delivery_Shipping();
		$method->maybe_create_shipment_for_order( $order );
	},
	20
);
