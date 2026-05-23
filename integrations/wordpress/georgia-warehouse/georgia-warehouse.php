<?php
/**
 * Plugin Name: LariPay.ai — Georgia Warehouse Sync
 * Plugin URI:  https://laripay.ai
 * Description: Sync WooCommerce with Fina, FMG Soft, Optimo WMS, 1C and other Georgian warehouse/ERP systems via LariPay.ai API.
 * Version:     1.0.0
 * Author:      Fintech Pay
 * Text Domain: georgia-warehouse
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 *
 * @package GeorgiaWarehouse
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'GEORGIA_WAREHOUSE_PATH', plugin_dir_path( __FILE__ ) );

require_once GEORGIA_WAREHOUSE_PATH . 'includes/class-georgia-warehouse-systems.php';
require_once GEORGIA_WAREHOUSE_PATH . 'includes/class-georgia-warehouse-client.php';
require_once GEORGIA_WAREHOUSE_PATH . 'includes/class-georgia-warehouse-sync.php';
require_once GEORGIA_WAREHOUSE_PATH . 'includes/class-georgia-warehouse-admin.php';

function georgia_warehouse_bootstrap() {
	if ( ! class_exists( 'WooCommerce' ) ) {
		return;
	}

	$sync  = new Georgia_Warehouse_Sync();
	$admin = new Georgia_Warehouse_Admin( $sync );

	add_action(
		'woocommerce_order_status_processing',
		function ( $order_id ) use ( $sync ) {
			$order = wc_get_order( $order_id );
			if ( $order ) {
				$sync->push_order( $order );
			}
		},
		25
	);

	// WP Cron hook for scheduled stock pull (optional: schedule via admin later).
	add_action(
		'georgia_warehouse_cron_pull_stock',
		function () use ( $sync ) {
			$sync->pull_stock();
		}
	);
}
add_action( 'plugins_loaded', 'georgia_warehouse_bootstrap', 12 );
