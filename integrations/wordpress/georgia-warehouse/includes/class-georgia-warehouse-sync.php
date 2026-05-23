<?php
/**
 * WooCommerce ↔ warehouse sync (Fina, FMG Soft, Optimo, 1C…).
 *
 * @package GeorgiaWarehouse
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Georgia_Warehouse_Sync
 */
class Georgia_Warehouse_Sync {

	/** @var string */
	private $option_key = 'georgia_warehouse_settings';

	/**
	 * @return array
	 */
	public function get_settings() {
		$defaults = array(
			'api_url'       => 'https://laripay.ai',
			'secret_key'    => '',
			'system'        => 'fina',
			'warehouse_id'  => '',
			'sync_stock'    => 'yes',
			'sync_orders'   => 'yes',
			'sync_products' => 'no',
		);
		return wp_parse_args( get_option( $this->option_key, array() ), $defaults );
	}

	/**
	 * @return Georgia_Warehouse_LariPay_Client|null
	 */
	public function get_client() {
		$s = $this->get_settings();
		if ( empty( $s['api_url'] ) || empty( $s['secret_key'] ) ) {
			return null;
		}
		return new Georgia_Warehouse_LariPay_Client( $s['api_url'], $s['secret_key'] );
	}

	/**
	 * Pull stock from warehouse and update WooCommerce products by SKU.
	 */
	public function pull_stock() {
		$client = $this->get_client();
		if ( ! $client ) {
			return new WP_Error( 'georgia_warehouse', __( 'LariPay warehouse API not configured.', 'georgia-warehouse' ) );
		}

		$s = $this->get_settings();
		try {
			$result = $client->sync_stock(
				array(
					'system'       => $s['system'],
					'direction'    => 'pull',
					'warehouse_id' => $s['warehouse_id'] ?: null,
				)
			);

			$updated = 0;
			$items   = isset( $result['items'] ) ? $result['items'] : array();
			foreach ( $items as $row ) {
				if ( empty( $row['sku'] ) || ! isset( $row['quantity'] ) ) {
					continue;
				}
				$product_id = wc_get_product_id_by_sku( (string) $row['sku'] );
				if ( ! $product_id ) {
					continue;
				}
				$product = wc_get_product( $product_id );
				if ( ! $product ) {
					continue;
				}
				$product->set_manage_stock( true );
				$product->set_stock_quantity( (int) $row['quantity'] );
				$product->save();
				$updated++;
			}

			return array(
				'job_id'  => $result['id'] ?? '',
				'synced'  => $result['synced_count'] ?? 0,
				'updated' => $updated,
			);
		} catch ( Exception $e ) {
			return new WP_Error( 'georgia_warehouse', $e->getMessage() );
		}
	}

	/**
	 * Push WooCommerce order to warehouse on processing.
	 *
	 * @param WC_Order $order Order.
	 */
	public function push_order( $order ) {
		if ( ! $order instanceof WC_Order ) {
			return;
		}
		if ( $order->get_meta( '_laripay_warehouse_sync_job' ) ) {
			return;
		}

		$client = $this->get_client();
		if ( ! $client ) {
			return;
		}

		$s = $this->get_settings();
		if ( 'yes' !== $s['sync_orders'] ) {
			return;
		}

		$lines = array();
		foreach ( $order->get_items() as $item ) {
			$product = $item->get_product();
			$lines[] = array(
				'sku'      => $product ? $product->get_sku() : '',
				'name'     => $item->get_name(),
				'quantity' => $item->get_quantity(),
				'price'    => (float) $order->get_item_total( $item, false, true ),
			);
		}

		$payload = array(
			'system'    => $s['system'],
			'direction' => 'push',
			'orders'    => array(
				array(
					'reference' => (string) $order->get_id(),
					'customer'  => array(
						'name'  => trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() ),
						'phone' => $order->get_billing_phone(),
						'email' => $order->get_billing_email(),
					),
					'shipping'  => array(
						'city'          => $order->get_shipping_city(),
						'address_line1' => $order->get_shipping_address_1(),
						'postal_code'   => $order->get_shipping_postcode(),
					),
					'lines'     => $lines,
					'total_gel' => (float) $order->get_total(),
				),
			),
		);

		try {
			$result = $client->sync_orders( $payload );
			$order->update_meta_data( '_laripay_warehouse_sync_job', $result['id'] ?? '' );
			$order->save();
			$order->add_order_note(
				sprintf(
					/* translators: 1: sync job id */
					__( 'Warehouse sync job created: %s', 'georgia-warehouse' ),
					$result['id'] ?? '—'
				)
			);
		} catch ( Exception $e ) {
			wc_get_logger()->error( 'Warehouse order sync: ' . $e->getMessage(), array( 'source' => 'georgia-warehouse' ) );
		}
	}
}
