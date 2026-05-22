<?php
/**
 * IPN / webhook callback handler.
 *
 * @package GeorgiaPay
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Georgia_Pay_Webhook_Handler
 */
class Georgia_Pay_Webhook_Handler {

	/**
	 * Register WooCommerce API routes for IPN callbacks.
	 */
	public static function register_routes() {
		add_action( 'woocommerce_api_georgia_pay_tbc_ipn', array( __CLASS__, 'handle_tbc' ) );
		add_action( 'woocommerce_api_georgia_pay_bog_ipn', array( __CLASS__, 'handle_bog' ) );
	}

	/**
	 * Handle TBC Pay IPN callback.
	 */
	public static function handle_tbc() {
		$raw_body = file_get_contents( 'php://input' );
		if ( false === $raw_body ) {
			$raw_body = '';
		}

		$gateway  = self::get_gateway();
		$settings = $gateway ? $gateway->get_settings_array() : array();
		$client_ip = self::get_client_ip();

		$result = self::verify_tbc( $raw_body, self::get_request_headers(), $client_ip, $settings );

		if ( empty( $result['valid'] ) ) {
			status_header( 401 );
			wp_send_json( array( 'error' => isset( $result['error'] ) ? $result['error'] : 'Unauthorized' ) );
		}

		self::complete_tbc_order( $result['payment_id'], $settings );

		status_header( 200 );
		exit;
	}

	/**
	 * Handle BOG Pay IPN callback.
	 */
	public static function handle_bog() {
		$raw_body = file_get_contents( 'php://input' );
		if ( false === $raw_body ) {
			$raw_body = '';
		}

		$gateway  = self::get_gateway();
		$settings = $gateway ? $gateway->get_settings_array() : array();

		$result = self::verify_bog( $raw_body, self::get_request_headers(), $settings );

		if ( empty( $result['valid'] ) ) {
			status_header( 401 );
			wp_send_json( array( 'error' => isset( $result['error'] ) ? $result['error'] : 'Unauthorized' ) );
		}

		self::complete_bog_order( $result['payload'], $settings );

		status_header( 200 );
		exit;
	}

	/**
	 * Verify TBC callback (IP allowlist + optional HMAC-SHA256).
	 *
	 * @param string $raw_body Raw body.
	 * @param array  $headers  Headers.
	 * @param string $client_ip Client IP.
	 * @param array  $settings Gateway settings.
	 * @return array
	 */
	public static function verify_tbc( $raw_body, $headers, $client_ip, $settings ) {
		$sandbox = isset( $settings['testmode'] ) && 'yes' === $settings['testmode'];

		if ( ! $sandbox && $client_ip && ! in_array( $client_ip, Georgia_Pay_Constants::TBC_CALLBACK_IPS, true ) ) {
			return array( 'valid' => false, 'error' => 'Invalid source IP' );
		}

		$signature = self::get_header(
			$headers,
			array( 'X-TBC-Signature', 'Callback-Signature', 'X-Signature' )
		);

		$secret = isset( $settings['tbc_client_secret'] ) ? $settings['tbc_client_secret'] : '';

		if ( $signature && $secret ) {
			$expected = hash_hmac( 'sha256', $raw_body, $secret );
			$received = preg_replace( '/^sha256=/i', '', $signature );
			if ( ! hash_equals( $expected, $received ) ) {
				return array( 'valid' => false, 'error' => 'Invalid HMAC signature' );
			}
		}

		$payload = json_decode( $raw_body, true );
		if ( ! is_array( $payload ) ) {
			return array( 'valid' => false, 'error' => 'Invalid JSON body' );
		}

		$payment_id = null;
		if ( isset( $payload['PaymentId'] ) ) {
			$payment_id = $payload['PaymentId'];
		} elseif ( isset( $payload['paymentId'] ) ) {
			$payment_id = $payload['paymentId'];
		} elseif ( isset( $payload['payId'] ) ) {
			$payment_id = $payload['payId'];
		}

		if ( empty( $payment_id ) ) {
			return array( 'valid' => false, 'error' => 'Missing PaymentId' );
		}

		return array(
			'valid'       => true,
			'payment_id'  => (string) $payment_id,
			'payload'     => $payload,
		);
	}

	/**
	 * Verify BOG callback (RSA SHA256).
	 *
	 * @param string $raw_body Raw body.
	 * @param array  $headers  Headers.
	 * @param array  $settings Gateway settings.
	 * @return array
	 */
	public static function verify_bog( $raw_body, $headers, $settings ) {
		$signature = self::get_header( $headers, array( 'Callback-Signature' ) );

		if ( empty( $signature ) ) {
			return array( 'valid' => false, 'error' => 'Missing Callback-Signature header' );
		}

		$public_key = isset( $settings['bog_callback_public_key'] ) ? trim( $settings['bog_callback_public_key'] ) : '';
		if ( empty( $public_key ) ) {
			$public_key = Georgia_Pay_Constants::BOG_DEFAULT_PUBLIC_KEY;
		}

		$decoded = base64_decode( $signature, true );
		if ( false === $decoded ) {
			return array( 'valid' => false, 'error' => 'Invalid signature encoding' );
		}

		$verified = openssl_verify( $raw_body, $decoded, $public_key, OPENSSL_ALGO_SHA256 );

		if ( 1 !== $verified ) {
			return array( 'valid' => false, 'error' => 'Invalid RSA signature' );
		}

		$payload = json_decode( $raw_body, true );
		if ( ! is_array( $payload ) ) {
			return array( 'valid' => false, 'error' => 'Invalid JSON body' );
		}

		return array(
			'valid'   => true,
			'payload' => $payload,
		);
	}

	/**
	 * Complete WooCommerce order from TBC IPN.
	 *
	 * @param string $payment_id Bank payment ID.
	 * @param array  $settings   Settings.
	 */
	public static function complete_tbc_order( $payment_id, $settings ) {
		try {
			$api     = new Georgia_Pay_API( $settings );
			$payment = $api->get_status( $payment_id );
		} catch ( Exception $e ) {
			self::log( 'TBC IPN status check failed: ' . $e->getMessage() );
			return;
		}

		$merchant_id = '';
		if ( isset( $payment['raw']['merchantPaymentId'] ) ) {
			$merchant_id = $payment['raw']['merchantPaymentId'];
		}

		if ( empty( $merchant_id ) ) {
			$order = self::find_order_by_meta( '_georgia_pay_reference', $payment_id );
		} else {
			$order = wc_get_order( $merchant_id );
		}

		if ( ! $order ) {
			self::log( 'TBC IPN: order not found for payment ' . $payment_id );
			return;
		}

		self::apply_tbc_status( $order, $payment['status'], $payment_id );
	}

	/**
	 * Complete WooCommerce order from BOG IPN.
	 *
	 * @param array $payload  Callback payload.
	 * @param array $settings Settings.
	 */
	public static function complete_bog_order( $payload, $settings ) {
		$body = isset( $payload['body'] ) ? $payload['body'] : array();

		$external_id = isset( $body['external_order_id'] ) ? $body['external_order_id'] : '';
		$status_key  = '';
		if ( isset( $body['order_status']['key'] ) ) {
			$status_key = $body['order_status']['key'];
		}

		$order = null;
		if ( $external_id ) {
			$order = wc_get_order( $external_id );
		}

		if ( ! $order && ! empty( $body['order_id'] ) ) {
			$order = self::find_order_by_meta( '_georgia_pay_reference', $body['order_id'] );
		}

		if ( ! $order ) {
			self::log( 'BOG IPN: order not found.' );
			return;
		}

		// Re-fetch status from bank when callback body is minimal.
		if ( empty( $status_key ) && ! empty( $body['order_id'] ) ) {
			try {
				$api    = new Georgia_Pay_API( $settings );
				$status = $api->get_status( $body['order_id'] );
				$status_key = $status['status'];
			} catch ( Exception $e ) {
				self::log( 'BOG IPN status check failed: ' . $e->getMessage() );
			}
		}

		$bank_ref = isset( $body['order_id'] ) ? $body['order_id'] : '';
		self::apply_bog_status( $order, $status_key, $bank_ref );
	}

	/**
	 * Apply TBC status to order.
	 *
	 * @param WC_Order $order      Order.
	 * @param string   $status     Bank status.
	 * @param string   $payment_id Transaction ID.
	 */
	public static function apply_tbc_status( $order, $status, $payment_id ) {
		if ( $order->is_paid() ) {
			return;
		}

		if ( 'Succeeded' === $status ) {
			$order->payment_complete( $payment_id );
			$order->add_order_note(
				sprintf(
					/* translators: %s: TBC payment ID */
					__( 'Payment confirmed via TBC Pay IPN (ID: %s).', 'georgia-pay' ),
					$payment_id
				)
			);
		} elseif ( in_array( $status, array( 'Failed', 'Expired', 'Returned' ), true ) ) {
			$order->update_status(
				'failed',
				sprintf(
					/* translators: %s: TBC payment status */
					__( 'TBC Pay payment %s.', 'georgia-pay' ),
					$status
				)
			);
		}
	}

	/**
	 * Apply BOG status to order.
	 *
	 * @param WC_Order $order    Order.
	 * @param string   $status   Bank status key.
	 * @param string   $bank_ref Bank order ID.
	 */
	public static function apply_bog_status( $order, $status, $bank_ref ) {
		if ( $order->is_paid() ) {
			return;
		}

		if ( 'completed' === $status ) {
			$order->payment_complete( $bank_ref );
			$order->add_order_note(
				sprintf(
					/* translators: %s: BOG order ID */
					__( 'Payment confirmed via BOG Pay IPN (ID: %s).', 'georgia-pay' ),
					$bank_ref
				)
			);
		} elseif ( 'rejected' === $status ) {
			$order->update_status(
				'failed',
				__( 'BOG Pay payment was rejected.', 'georgia-pay' )
			);
		}
	}

	/**
	 * Find order by meta key/value.
	 *
	 * @param string $key   Meta key.
	 * @param string $value Meta value.
	 * @return WC_Order|false
	 */
	public static function find_order_by_meta( $key, $value ) {
		$orders = wc_get_orders(
			array(
				'limit'      => 1,
				'meta_key'   => $key,
				'meta_value' => $value,
				'return'     => 'objects',
			)
		);

		return ! empty( $orders ) ? $orders[0] : false;
	}

	/**
	 * @return WC_Georgia_Pay_Gateway|null
	 */
	private static function get_gateway() {
		$gateways = WC()->payment_gateways()->payment_gateways();
		return isset( $gateways['georgia_pay'] ) ? $gateways['georgia_pay'] : null;
	}

	/**
	 * @return array
	 */
	private static function get_request_headers() {
		$headers = array();
		foreach ( $_SERVER as $key => $value ) {
			if ( 0 === strpos( $key, 'HTTP_' ) ) {
				$name            = str_replace( '_', '-', substr( $key, 5 ) );
				$headers[ $name ] = is_string( $value ) ? $value : '';
			}
		}
		return $headers;
	}

	/**
	 * @return string
	 */
	private static function get_client_ip() {
		$ip = '';
		if ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
			$ip = sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) );
			if ( false !== strpos( $ip, ',' ) ) {
				$parts = explode( ',', $ip );
				$ip    = trim( $parts[0] );
			}
		} elseif ( ! empty( $_SERVER['REMOTE_ADDR'] ) ) {
			$ip = sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) );
		}
		return $ip;
	}

	/**
	 * @param array  $headers Header list.
	 * @param array  $names   Names to find.
	 * @return string
	 */
	private static function get_header( $headers, $names ) {
		$normalized = array();
		foreach ( $headers as $key => $value ) {
			$normalized[ strtolower( $key ) ] = $value;
		}
		foreach ( $names as $name ) {
			$lower = strtolower( $name );
			if ( ! empty( $normalized[ $lower ] ) ) {
				return $normalized[ $lower ];
			}
		}
		return '';
	}

	/**
	 * @param string $message Log message.
	 */
	private static function log( $message ) {
		if ( function_exists( 'wc_get_logger' ) ) {
			wc_get_logger()->error( $message, array( 'source' => 'georgia-pay' ) );
		}
	}
}

// Legacy direct bank IPN — use Payka API instead. Routes disabled.
// Georgia_Pay_Webhook_Handler::register_routes();
