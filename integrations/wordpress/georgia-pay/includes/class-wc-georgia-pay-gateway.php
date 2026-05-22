<?php
/**
 * WooCommerce gateway — LariPay.ai API (1% commission or subscription).
 *
 * @package GeorgiaPay
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class WC_Georgia_Pay_Gateway
 */
class WC_Georgia_Pay_Gateway extends WC_Payment_Gateway {

	/**
	 * Bank provider for checkout: tbc|bog.
	 *
	 * @var string
	 */
	public $bank;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->id                 = 'georgia_pay';
		$this->icon               = apply_filters( 'georgia_pay_icon', '' );
		$this->method_title       = __( 'LariPay.ai — TBC & BOG (GEL)', 'georgia-pay' );
		$this->method_description = __( 'Pay via LariPay.ai: TBC Pay or BOG Pay. Platform fee 1% or subscription plan.', 'georgia-pay' );
		$this->has_fields         = false;
		$this->supports           = array( 'products' );

		$this->init_form_fields();
		$this->init_settings();

		$this->title       = $this->get_option( 'title' );
		$this->description = $this->get_option( 'description' );
		$this->enabled     = $this->get_option( 'enabled' );
		$this->bank        = $this->get_option( 'bank', 'tbc' );

		add_action(
			'woocommerce_update_options_payment_gateways_' . $this->id,
			array( $this, 'process_admin_options' )
		);
		add_action(
			'woocommerce_update_options_payment_gateways_' . $this->id,
			array( $this, 'register_laripay_webhook' ),
			20
		);
		add_action( 'woocommerce_thankyou_' . $this->id, array( $this, 'handle_return' ) );
		add_action( 'woocommerce_email_before_order_table', array( $this, 'email_instructions' ), 10, 4 );
	}

	/**
	 * Read LariPay setting (supports legacy payka_* keys).
	 *
	 * @param string $key     Setting suffix without prefix.
	 * @param string $default Default value.
	 * @return string
	 */
	public function get_laripay_option( $key, $default = '' ) {
		$modern = trim( (string) $this->get_option( 'laripay_' . $key, '' ) );
		if ( '' !== $modern ) {
			return $modern;
		}
		return trim( (string) $this->get_option( 'payka_' . $key, $default ) );
	}

	/**
	 * Admin settings.
	 */
	public function init_form_fields() {
		$webhook_url = $this->get_laripay_webhook_url();

		$this->form_fields = array(
			'enabled'     => array(
				'title'   => __( 'Enable/Disable', 'georgia-pay' ),
				'type'    => 'checkbox',
				'label'   => __( 'Enable LariPay.ai payments', 'georgia-pay' ),
				'default' => 'no',
			),
			'title'       => array(
				'title'       => __( 'Title', 'georgia-pay' ),
				'type'        => 'text',
				'default'     => __( 'Pay with card (GEL)', 'georgia-pay' ),
				'desc_tip'    => true,
			),
			'description' => array(
				'title'       => __( 'Description', 'georgia-pay' ),
				'type'        => 'textarea',
				'default'     => __( 'Secure payment via TBC or Bank of Georgia (LariPay.ai).', 'georgia-pay' ),
				'desc_tip'    => true,
			),
			'laripay_section' => array(
				'title'       => __( 'LariPay.ai API', 'georgia-pay' ),
				'type'        => 'title',
				'description' => __( 'Get your secret key from LariPay.ai dashboard or /api/laripay/setup. Billing: 1% per payment or monthly subscription.', 'georgia-pay' ),
			),
			'laripay_api_url' => array(
				'title'       => __( 'LariPay.ai API URL', 'georgia-pay' ),
				'type'        => 'text',
				'description' => __( 'Example: https://laripay.ai or your ngrok URL', 'georgia-pay' ),
				'default'     => '',
				'desc_tip'    => true,
			),
			'laripay_secret_key' => array(
				'title'       => __( 'Secret API key', 'georgia-pay' ),
				'type'        => 'password',
				'description' => __( 'sk_test_... or sk_live_...', 'georgia-pay' ),
				'default'     => '',
			),
			'laripay_webhook_secret' => array(
				'title'       => __( 'Webhook signing secret', 'georgia-pay' ),
				'type'        => 'password',
				'description' => __( 'whsec_... from LariPay.ai merchant (optional if using return URL only).', 'georgia-pay' ),
				'default'     => '',
			),
			'bank'        => array(
				'title'   => __( 'Bank provider', 'georgia-pay' ),
				'type'    => 'select',
				'default' => 'tbc',
				'options' => array(
					'tbc' => __( 'TBC Pay', 'georgia-pay' ),
					'bog' => __( 'BOG Pay', 'georgia-pay' ),
				),
			),
			'webhook_section' => array(
				'title'       => __( 'LariPay.ai webhook (recommended)', 'georgia-pay' ),
				'type'        => 'title',
				'description' => sprintf(
					/* translators: %s: webhook URL */
					__( 'Register this URL in LariPay.ai admin for events payment.succeeded and payment.failed:%1$s%2$s', 'georgia-pay' ),
					'<br><br>',
					'<code>' . esc_html( $webhook_url ) . '</code>'
				),
			),
		);
	}

	/**
	 * WooCommerce LariPay.ai webhook endpoint.
	 *
	 * @return string
	 */
	public function get_laripay_webhook_url() {
		if ( function_exists( 'WC' ) && WC()->api_request_url ) {
			return WC()->api_request_url( 'georgia_pay_laripay' );
		}
		return home_url( '/?wc-api=georgia_pay_laripay' );
	}

	/**
	 * Register WooCommerce webhook URL with LariPay.ai after settings save.
	 */
	public function register_laripay_webhook() {
		$client = $this->get_laripay_client();
		if ( ! $client ) {
			return;
		}

		$webhook_url = $this->get_laripay_webhook_url();
		$client->register_webhook_endpoint( $webhook_url );
	}

	/**
	 * @return Georgia_Pay_LariPay_Client|null
	 */
	public function get_laripay_client() {
		$url = $this->get_laripay_option( 'api_url' );
		$key = $this->get_laripay_option( 'secret_key' );

		if ( empty( $url ) || empty( $key ) ) {
			return null;
		}

		return new Georgia_Pay_LariPay_Client( $url, $key );
	}

	/**
	 * @return bool
	 */
	public function is_available() {
		if ( 'yes' !== $this->enabled ) {
			return false;
		}

		if ( ! parent::is_available() ) {
			return false;
		}

		if ( Georgia_Pay_Constants::CURRENCY_CODE !== get_woocommerce_currency() ) {
			return false;
		}

		return null !== $this->get_laripay_client();
	}

	/**
	 * @param int $order_id Order ID.
	 * @return array
	 */
	public function process_payment( $order_id ) {
		$order = wc_get_order( $order_id );

		if ( ! $order ) {
			wc_add_notice( __( 'Order not found.', 'georgia-pay' ), 'error' );
			return array( 'result' => 'fail' );
		}

		$client = $this->get_laripay_client();
		if ( ! $client ) {
			wc_add_notice( __( 'LariPay.ai is not configured.', 'georgia-pay' ), 'error' );
			return array( 'result' => 'fail' );
		}

		try {
			$return_url = $this->get_return_url( $order );
			$cancel_url = wc_get_checkout_url();

			$session = $client->create_checkout_session(
				(float) $order->get_total(),
				$return_url,
				$cancel_url,
				(string) $order_id,
				$this->bank
			);

			$order->update_meta_data( '_laripay_session_id', $session['id'] );
			$order->update_meta_data( '_laripay_payment_id', $session['payment_id'] );
			$order->update_meta_data( '_laripay_platform_fee', $session['platform_fee'] );
			$order->update_meta_data( '_laripay_fee_mode', $session['fee_mode'] );
			$order->save();

			$order->update_status(
				'pending',
				sprintf(
					/* translators: 1: session id */
					__( 'Awaiting LariPay.ai payment (session %s).', 'georgia-pay' ),
					$session['id']
				)
			);

			WC()->cart->empty_cart();

			return array(
				'result'   => 'success',
				'redirect' => $session['url'],
			);
		} catch ( Exception $e ) {
			wc_get_logger()->error(
				$e->getMessage(),
				array(
					'source'   => 'georgia-pay',
					'order_id' => $order_id,
				)
			);
			wc_add_notice(
				__( 'Payment could not be started. Please try again.', 'georgia-pay' ),
				'error'
			);
			return array( 'result' => 'fail' );
		}
	}

	/**
	 * @param int $order_id Order ID.
	 */
	public function handle_return( $order_id ) {
		$order = wc_get_order( $order_id );

		if ( ! $order || $order->get_payment_method() !== $this->id ) {
			return;
		}

		if ( $order->is_paid() ) {
			echo '<p class="georgia-pay-notice">' . esc_html__( 'Thank you — your payment has been received.', 'georgia-pay' ) . '</p>';
			return;
		}

		$session_id = $order->get_meta( '_laripay_session_id' );
		if ( ! $session_id ) {
			$session_id = $order->get_meta( '_payka_session_id' );
		}
		$client = $this->get_laripay_client();

		if ( $session_id && $client ) {
			try {
				$data = $client->get_checkout_session( $session_id );
				if ( isset( $data['status'] ) && 'complete' === $data['status'] ) {
					$payment_id = $order->get_meta( '_laripay_payment_id' ) ?: $order->get_meta( '_payka_payment_id' );
					$order->payment_complete( $payment_id );
					echo '<p class="georgia-pay-notice">' . esc_html__( 'Thank you — your payment has been received.', 'georgia-pay' ) . '</p>';
					return;
				}
				if ( isset( $data['payment_status'] ) && 'succeeded' === $data['payment_status'] ) {
					$payment_id = $order->get_meta( '_laripay_payment_id' ) ?: $order->get_meta( '_payka_payment_id' );
					$order->payment_complete( $payment_id );
					echo '<p class="georgia-pay-notice">' . esc_html__( 'Thank you — your payment has been received.', 'georgia-pay' ) . '</p>';
					return;
				}
			} catch ( Exception $e ) {
				wc_get_logger()->error( 'LariPay.ai return poll: ' . $e->getMessage(), array( 'source' => 'georgia-pay' ) );
			}
		}

		echo '<p class="georgia-pay-notice">' . esc_html__( 'Your payment is being processed. You will receive confirmation shortly.', 'georgia-pay' ) . '</p>';
	}

	/**
	 * @param WC_Order $order         Order.
	 * @param bool     $sent_to_admin Admin.
	 * @param bool     $plain_text    Plain.
	 * @param WC_Email $email         Email.
	 */
	public function email_instructions( $order, $sent_to_admin, $plain_text, $email ) {
		if ( ! $order instanceof WC_Order || $this->id !== $order->get_payment_method() || $sent_to_admin ) {
			return;
		}
		if ( ! in_array( $order->get_status(), array( 'pending', 'on-hold' ), true ) ) {
			return;
		}

		$message = __( 'Complete your payment at the bank if you have not already done so.', 'georgia-pay' );
		if ( $plain_text ) {
			echo esc_html( $message ) . "\n\n";
		} else {
			echo '<p>' . esc_html( $message ) . '</p>';
		}
	}
}
