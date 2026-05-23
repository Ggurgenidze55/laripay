<?php
/**
 * WooCommerce shipping method — LariPay.ai Georgian couriers.
 *
 * @package GeorgiaDelivery
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class WC_Georgia_Delivery_Shipping
 */
class WC_Georgia_Delivery_Shipping extends WC_Shipping_Method {

	/** @var string */
	public $carrier;

	/** @var string */
	public $origin_city;

	/** @var string */
	public $origin_address;

	/**
	 * Constructor.
	 *
	 * @param int $instance_id Instance.
	 */
	public function __construct( $instance_id = 0 ) {
		$this->id                 = 'georgia_delivery';
		$this->instance_id        = absint( $instance_id );
		$this->method_title       = __( 'LariPay.ai — Georgian couriers', 'georgia-delivery' );
		$this->method_description = __( 'Live shipping rates from Delivo, OnWay, Georgian Post, Glovo, Wolt, Bolt, KiwiPost, DHL and more via LariPay.ai API.', 'georgia-delivery' );
		$this->supports           = array( 'shipping-zones', 'instance-settings' );

		$this->init_form_fields();
		$this->init_settings();

		$this->enabled         = $this->get_option( 'enabled' );
		$this->title           = $this->get_option( 'title' );
		$this->carrier         = $this->get_option( 'carrier', 'delivo' );
		$this->origin_city     = $this->get_option( 'origin_city', 'Tbilisi' );
		$this->origin_address  = $this->get_option( 'origin_address', '' );

		add_action( 'woocommerce_update_options_shipping_' . $this->id, array( $this, 'process_admin_options' ) );
	}

	/**
	 * Settings fields.
	 */
	public function init_form_fields() {
		$this->instance_form_fields = array(
			'enabled'        => array(
				'title'   => __( 'Enable', 'georgia-delivery' ),
				'type'    => 'checkbox',
				'label'   => __( 'Enable LariPay.ai delivery rates', 'georgia-delivery' ),
				'default' => 'yes',
			),
			'title'            => array(
				'title'   => __( 'Method title', 'georgia-delivery' ),
				'type'    => 'text',
				'default' => __( 'Courier delivery (Georgia)', 'georgia-delivery' ),
			),
			'laripay_api_url'  => array(
				'title'   => __( 'LariPay.ai API URL', 'georgia-delivery' ),
				'type'    => 'text',
				'default' => 'https://laripay.ai',
			),
			'laripay_secret_key' => array(
				'title' => __( 'Secret API key', 'georgia-delivery' ),
				'type'  => 'password',
			),
			'carrier'          => array(
				'title'   => __( 'Default carrier', 'georgia-delivery' ),
				'type'    => 'select',
				'default' => 'delivo',
				'options' => georgia_delivery_carrier_options(),
			),
			'origin_city'      => array(
				'title'   => __( 'Ship-from city', 'georgia-delivery' ),
				'type'    => 'text',
				'default' => 'Tbilisi',
			),
			'origin_address'   => array(
				'title'   => __( 'Ship-from address', 'georgia-delivery' ),
				'type'    => 'text',
				'default' => '',
			),
			'auto_shipment'    => array(
				'title'   => __( 'Auto-create shipment', 'georgia-delivery' ),
				'type'    => 'checkbox',
				'label'   => __( 'Create courier shipment when order moves to Processing', 'georgia-delivery' ),
				'default' => 'yes',
			),
		);
	}

	/**
	 * @return Georgia_Delivery_LariPay_Client|null
	 */
	public function get_client() {
		$url = trim( (string) $this->get_option( 'laripay_api_url' ) );
		$key = trim( (string) $this->get_option( 'laripay_secret_key' ) );
		if ( ! $url || ! $key ) {
			return null;
		}
		return new Georgia_Delivery_LariPay_Client( $url, $key );
	}

	/**
	 * @param array $package Package.
	 */
	public function calculate_shipping( $package = array() ) {
		if ( 'yes' !== $this->enabled ) {
			return;
		}

		$client = $this->get_client();
		if ( ! $client ) {
			return;
		}

		$dest = isset( $package['destination'] ) ? $package['destination'] : array();
		if ( empty( $dest['city'] ) ) {
			return;
		}

		$weight = 0.0;
		foreach ( $package['contents'] as $item ) {
			$product = $item['data'];
			if ( $product && $product->has_weight() ) {
				$weight += (float) $product->get_weight() * (int) $item['quantity'];
			}
		}
		if ( $weight <= 0 ) {
			$weight = 1.0;
		}

		$from = array(
			'city'          => $this->origin_city,
			'address_line1' => $this->origin_address ?: $this->origin_city,
		);
		$to = array(
			'city'          => $dest['city'],
			'address_line1' => trim( ( $dest['address'] ?? '' ) . ' ' . ( $dest['address_2'] ?? '' ) ),
			'postal_code'   => $dest['postcode'] ?? '',
		);

		try {
			$quote = $client->get_rates( $from, $to, $weight, $this->carrier );
			$rates = isset( $quote['rates'] ) ? $quote['rates'] : array();

			foreach ( $rates as $rate ) {
				$service = isset( $rate['service'] ) ? $rate['service'] : 'standard';
				$label   = $this->title . ' — ' . ucfirst( str_replace( '_', ' ', $service ) );
				if ( ! empty( $rate['eta_label'] ) ) {
					$label .= ' (' . $rate['eta_label'] . ')';
				}

				$this->add_rate(
					array(
						'id'        => $this->get_rate_id( $service ),
						'label'     => $label,
						'cost'      => isset( $rate['price_gel'] ) ? (float) $rate['price_gel'] : 0,
						'meta_data' => array(
							'laripay_carrier' => isset( $quote['carrier'] ) ? $quote['carrier'] : $this->carrier,
							'laripay_service' => $service,
						),
					)
				);
			}
		} catch ( Exception $e ) {
			wc_get_logger()->error( 'LariPay delivery rates: ' . $e->getMessage(), array( 'source' => 'georgia-delivery' ) );
		}
	}

	/**
	 * @param WC_Order $order Order.
	 */
	public function maybe_create_shipment_for_order( $order ) {
		if ( 'yes' !== $this->get_option( 'auto_shipment', 'yes' ) ) {
			return;
		}

		$uses_method = false;
		foreach ( $order->get_shipping_methods() as $line ) {
			if ( strpos( $line->get_method_id(), 'georgia_delivery' ) === 0 ) {
				$uses_method = true;
				break;
			}
		}
		if ( ! $uses_method ) {
			return;
		}

		$client = $this->get_client();
		if ( ! $client ) {
			return;
		}

		$weight = 0.0;
		foreach ( $order->get_items() as $item ) {
			$product = $item->get_product();
			if ( $product && $product->has_weight() ) {
				$weight += (float) $product->get_weight() * $item->get_quantity();
			}
		}
		if ( $weight <= 0 ) {
			$weight = 1.0;
		}

		$from = array(
			'city'          => $this->origin_city,
			'address_line1' => $this->origin_address ?: $this->origin_city,
		);
		$to = array(
			'name'          => trim( $order->get_shipping_first_name() . ' ' . $order->get_shipping_last_name() ),
			'phone'         => $order->get_billing_phone(),
			'city'          => $order->get_shipping_city(),
			'address_line1' => trim( $order->get_shipping_address_1() . ' ' . $order->get_shipping_address_2() ),
			'postal_code'   => $order->get_shipping_postcode(),
		);

		try {
			$shipment = $client->create_shipment(
				array(
					'from'                => $from,
					'to'                  => $to,
					'weight_kg'           => $weight,
					'carrier'             => $this->carrier,
					'client_reference_id' => (string) $order->get_id(),
					'description'         => sprintf( 'WooCommerce order #%d', $order->get_id() ),
				)
			);

			$order->update_meta_data( '_laripay_delivery_shipment_id', $shipment['id'] );
			if ( ! empty( $shipment['tracking_number'] ) ) {
				$order->update_meta_data( '_laripay_delivery_tracking', $shipment['tracking_number'] );
			}
			$order->save();

			$order->add_order_note(
				sprintf(
					/* translators: 1: tracking number */
					__( 'LariPay delivery shipment created. Tracking: %s', 'georgia-delivery' ),
					$shipment['tracking_number'] ?? $shipment['id']
				)
			);
		} catch ( Exception $e ) {
			wc_get_logger()->error( 'LariPay delivery shipment: ' . $e->getMessage(), array( 'source' => 'georgia-delivery' ) );
		}
	}
}
