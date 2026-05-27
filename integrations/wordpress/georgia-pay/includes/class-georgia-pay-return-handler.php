<?php
/**
 * LariPay.ai return URL handling — instant payment outcome on thank-you page.
 *
 * @package GeorgiaPay
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Georgia_Pay_Return_Handler
 */
class Georgia_Pay_Return_Handler {

	/**
	 * Register hooks.
	 */
	public static function init() {
		add_action( 'template_redirect', array( __CLASS__, 'process_return' ), 5 );
		add_filter( 'woocommerce_payment_complete_order_status', array( __CLASS__, 'order_status_after_payment' ), 10, 3 );
	}

	/**
	 * LariPay gateway IDs.
	 *
	 * @return string[]
	 */
	public static function gateway_ids() {
		return array( 'georgia_pay', 'georgia_pay_installments' );
	}

	/**
	 * Process ?laripay=success|failed before thank-you page renders.
	 */
	public static function process_return() {
		if ( ! function_exists( 'is_wc_endpoint_url' ) || ! is_wc_endpoint_url( 'order-received' ) ) {
			return;
		}

		$result = self::get_return_result();
		if ( ! $result ) {
			return;
		}

		$order_id = absint( get_query_var( 'order-received' ) );
		if ( ! $order_id ) {
			return;
		}

		$order = wc_get_order( $order_id );
		if ( ! self::is_valid_return_order( $order ) ) {
			return;
		}

		if ( 'success' === $result ) {
			self::mark_paid( $order );
		} else {
			self::mark_failed( $order );
		}
	}

	/**
	 * @return string|null success|failed
	 */
	public static function get_return_result() {
		if ( ! isset( $_GET['laripay'] ) ) {
			return null;
		}

		$result = sanitize_text_field( wp_unslash( $_GET['laripay'] ) );
		if ( ! in_array( $result, array( 'success', 'failed' ), true ) ) {
			return null;
		}

		return $result;
	}

	/**
	 * @param WC_Order|false|null $order Order.
	 * @return bool
	 */
	public static function is_valid_return_order( $order ) {
		if ( ! $order instanceof WC_Order ) {
			return false;
		}

		if ( ! in_array( $order->get_payment_method(), self::gateway_ids(), true ) ) {
			return false;
		}

		if ( ! isset( $_GET['key'] ) ) {
			return false;
		}

		$key = wc_clean( wp_unslash( $_GET['key'] ) );
		return hash_equals( $order->get_order_key(), $key );
	}

	/**
	 * Mark order paid from return URL or session poll.
	 *
	 * @param WC_Order $order Order.
	 * @return bool True when order is paid after this call.
	 */
	public static function mark_paid( $order ) {
		if ( $order->is_paid() ) {
			return true;
		}

		$payment_id = $order->get_meta( '_laripay_payment_id' );
		if ( ! $payment_id ) {
			$payment_id = $order->get_meta( '_payka_payment_id' );
		}

		$order->payment_complete( $payment_id ? (string) $payment_id : '' );
		$order->add_order_note( __( 'LariPay.ai: payment confirmed.', 'georgia-pay' ) );

		return true;
	}

	/**
	 * @param WC_Order $order Order.
	 */
	public static function mark_failed( $order ) {
		if ( $order->is_paid() ) {
			return;
		}

		if ( in_array( $order->get_status(), array( 'failed', 'cancelled', 'refunded' ), true ) ) {
			return;
		}

		$order->update_status( 'failed', __( 'LariPay.ai: payment was not completed.', 'georgia-pay' ) );
	}

	/**
	 * Use Completed instead of Processing after successful LariPay payment.
	 *
	 * @param string   $status   Default status.
	 * @param int      $order_id Order ID.
	 * @param WC_Order $order    Order.
	 * @return string
	 */
	public static function order_status_after_payment( $status, $order_id, $order ) {
		if ( $order instanceof WC_Order && in_array( $order->get_payment_method(), self::gateway_ids(), true ) ) {
			return 'completed';
		}

		return $status;
	}

	/**
	 * Render visible payment outcome on thank-you page.
	 *
	 * @param WC_Order $order Order.
	 */
	public static function render_notice( $order ) {
		$result = self::get_return_result();

		if ( 'success' === $result || ( ! $result && $order->is_paid() ) ) {
			self::echo_notice(
				'success',
				__( 'Payment successful', 'georgia-pay' ),
				__( 'Your payment has been received. Thank you for your order!', 'georgia-pay' )
			);
			return;
		}

		if ( 'failed' === $result || 'failed' === $order->get_status() ) {
			self::echo_notice(
				'failed',
				__( 'Payment failed', 'georgia-pay' ),
				__( 'Your payment could not be completed. Please try again or choose another payment method.', 'georgia-pay' )
			);
			return;
		}
	}

	/**
	 * @param string $type    success|failed.
	 * @param string $title   Heading.
	 * @param string $message Body text.
	 */
	private static function echo_notice( $type, $title, $message ) {
		printf(
			'<div class="georgia-pay-result georgia-pay-result--%1$s" role="status"><div class="georgia-pay-result__icon" aria-hidden="true"></div><div class="georgia-pay-result__body"><strong class="georgia-pay-result__title">%2$s</strong><p class="georgia-pay-result__message">%3$s</p></div></div>',
			esc_attr( $type ),
			esc_html( $title ),
			esc_html( $message )
		);
	}

	/**
	 * Poll LariPay session when return flag is missing (legacy / webhook delay).
	 *
	 * @param WC_Order                  $order  Order.
	 * @param Georgia_Pay_LariPay_Client $client API client.
	 * @return bool True when order was marked paid.
	 */
	public static function poll_session_and_complete( $order, $client ) {
		$session_id = $order->get_meta( '_laripay_session_id' );
		if ( ! $session_id ) {
			$session_id = $order->get_meta( '_payka_session_id' );
		}

		if ( ! $session_id || ! $client ) {
			return false;
		}

		try {
			$data = $client->get_checkout_session( $session_id );
			$complete = ( isset( $data['status'] ) && 'complete' === $data['status'] )
				|| ( isset( $data['payment_status'] ) && 'succeeded' === $data['payment_status'] );

			if ( $complete ) {
				self::mark_paid( $order );
				return true;
			}
		} catch ( Exception $e ) {
			wc_get_logger()->error(
				'LariPay.ai return poll: ' . $e->getMessage(),
				array(
					'source'   => 'georgia-pay',
					'order_id' => $order->get_id(),
				)
			);
		}

		return false;
	}
}
