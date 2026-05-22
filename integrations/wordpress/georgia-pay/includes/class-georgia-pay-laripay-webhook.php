<?php
/**
 * LariPay.ai platform webhooks → WooCommerce order updates.
 *
 * @package GeorgiaPay
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Georgia_Pay_LariPay_Webhook
 */
class Georgia_Pay_LariPay_Webhook {

	/**
	 * Register WC API routes (current + legacy slug).
	 */
	public static function register_routes() {
		add_action( 'woocommerce_api_georgia_pay_laripay', array( __CLASS__, 'handle' ) );
		add_action( 'woocommerce_api_georgia_pay_payka', array( __CLASS__, 'handle' ) );
	}

	/**
	 * Handle LariPay.ai event POST.
	 */
	public static function handle() {
		$raw_body = file_get_contents( 'php://input' );
		if ( false === $raw_body ) {
			$raw_body = '';
		}

		$gateway = self::get_gateway();
		if ( ! $gateway ) {
			status_header( 500 );
			exit;
		}

		$secret = $gateway->get_laripay_option( 'webhook_secret' );
		if ( ! empty( $secret ) && ! self::verify_signature( $raw_body, $secret ) ) {
			status_header( 401 );
			wp_send_json( array( 'error' => 'Invalid signature' ) );
		}

		$payload = json_decode( $raw_body, true );
		if ( ! is_array( $payload ) ) {
			status_header( 400 );
			exit;
		}

		$type = isset( $payload['type'] ) ? $payload['type'] : '';
		$object = isset( $payload['data']['object'] ) ? $payload['data']['object'] : array();

		if ( 'payment.succeeded' === $type ) {
			self::mark_order_paid_from_payment( $object );
		} elseif ( 'checkout.session.completed' === $type ) {
			if ( ! empty( $object['payment_id'] ) ) {
				// Handled via payment.succeeded usually.
			}
		} elseif ( 'payment.failed' === $type ) {
			self::mark_order_failed( $object );
		}

		status_header( 200 );
		echo wp_json_encode( array( 'ok' => true ) );
		exit;
	}

	/**
	 * @param array $payment LariPay.ai payment object from webhook.
	 */
	private static function mark_order_paid_from_payment( $payment ) {
		$order_id = isset( $payment['client_reference_id'] ) ? absint( $payment['client_reference_id'] ) : 0;
		if ( ! $order_id ) {
			return;
		}

		$order = wc_get_order( $order_id );
		if ( ! $order || $order->get_payment_method() !== 'georgia_pay' ) {
			return;
		}

		if ( $order->is_paid() ) {
			return;
		}

		$order->payment_complete( isset( $payment['id'] ) ? $payment['id'] : '' );
		$order->add_order_note(
			sprintf(
				/* translators: 1: fee, 2: fee mode */
				__( 'LariPay.ai: payment received (platform fee: %1$s GEL, mode: %2$s).', 'georgia-pay' ),
				isset( $payment['platform_fee'] ) ? $payment['platform_fee'] : '0',
				isset( $payment['fee_mode'] ) ? $payment['fee_mode'] : 'commission'
			)
		);
	}

	/**
	 * @param array $payment Payment payload.
	 */
	private static function mark_order_failed( $payment ) {
		$order_id = isset( $payment['client_reference_id'] ) ? absint( $payment['client_reference_id'] ) : 0;
		if ( ! $order_id ) {
			return;
		}

		$order = wc_get_order( $order_id );
		if ( ! $order || $order->get_payment_method() !== 'georgia_pay' ) {
			return;
		}

		if ( ! $order->is_paid() ) {
			$order->update_status( 'failed', __( 'LariPay.ai: payment failed.', 'georgia-pay' ) );
		}
	}

	/**
	 * Verify LariPay-Signature header (HMAC SHA256).
	 *
	 * @param string $raw_body Raw body.
	 * @param string $secret   whsec_...
	 * @return bool
	 */
	private static function verify_signature( $raw_body, $secret ) {
		$timestamp = '';
		if ( isset( $_SERVER['HTTP_LARIPAY_TIMESTAMP'] ) ) {
			$timestamp = sanitize_text_field( wp_unslash( $_SERVER['HTTP_LARIPAY_TIMESTAMP'] ) );
		} elseif ( isset( $_SERVER['HTTP_PAYKA_TIMESTAMP'] ) ) {
			$timestamp = sanitize_text_field( wp_unslash( $_SERVER['HTTP_PAYKA_TIMESTAMP'] ) );
		}
		$signature = '';
		if ( isset( $_SERVER['HTTP_LARIPAY_SIGNATURE'] ) ) {
			$signature = sanitize_text_field( wp_unslash( $_SERVER['HTTP_LARIPAY_SIGNATURE'] ) );
		} elseif ( isset( $_SERVER['HTTP_PAYKA_SIGNATURE'] ) ) {
			$signature = sanitize_text_field( wp_unslash( $_SERVER['HTTP_PAYKA_SIGNATURE'] ) );
		}

		if ( ! $timestamp || ! $signature ) {
			return false;
		}

		$expected = hash_hmac( 'sha256', $timestamp . '.' . $raw_body, $secret );
		return hash_equals( $expected, $signature );
	}

	/**
	 * @return WC_Georgia_Pay_Gateway|null
	 */
	private static function get_gateway() {
		if ( ! function_exists( 'WC' ) ) {
			return null;
		}
		$gateways = WC()->payment_gateways()->payment_gateways();
		return isset( $gateways['georgia_pay'] ) ? $gateways['georgia_pay'] : null;
	}
}

/** @deprecated */
class_alias( Georgia_Pay_LariPay_Webhook::class, 'Georgia_Pay_Payka_Webhook' );
