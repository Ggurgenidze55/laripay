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
		$this->icon               = apply_filters( 'georgia_pay_icon', $this->get_checkout_icon_html() );
		$this->method_title       = __( 'LariPay.ai — Georgian banks (GEL)', 'georgia-pay' );
		$this->method_description = __( 'Pay via LariPay.ai: TBC, BOG, Liberty, Credo, Cartu, Basis, Flitt. Bank-hosted card checkout.', 'georgia-pay' );
		$this->has_fields         = true;
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
		add_action( 'woocommerce_checkout_create_order', array( $this, 'capture_classic_checkout_bank' ), 10, 2 );
		add_action( 'woocommerce_store_api_checkout_update_order_from_request', array( $this, 'capture_store_api_bank' ), 10, 2 );
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
				'default'     => __( 'Secure payment via Georgian banks (LariPay.ai).', 'georgia-pay' ),
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
				'default'     => 'https://laripay.vercel.app',
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
				'title'       => __( 'Default bank', 'georgia-pay' ),
				'type'        => 'select',
				'description' => __( 'Pre-selected bank at checkout. Customers can choose another bank before paying.', 'georgia-pay' ),
				'default'     => 'tbc',
				'options'     => georgia_pay_bank_options(),
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
	 * Default bank from admin settings.
	 *
	 * @return string
	 */
	protected function get_default_bank() {
		$bank = is_string( $this->bank ) ? $this->bank : 'tbc';
		return georgia_pay_is_valid_bank( $bank ) ? $bank : 'tbc';
	}

	/**
	 * Resolve bank selected at checkout.
	 *
	 * @param WC_Order|null $order Order when available.
	 * @return string
	 */
	protected function resolve_checkout_bank( $order = null ) {
		if ( $order instanceof WC_Order ) {
			$stored = $order->get_meta( '_laripay_bank' );
			if ( $stored && georgia_pay_is_valid_bank( $stored ) ) {
				return $stored;
			}
		}

		if ( isset( $_POST['georgia_pay_bank'] ) ) {
			$posted = sanitize_text_field( wp_unslash( $_POST['georgia_pay_bank'] ) );
			if ( georgia_pay_is_valid_bank( $posted ) ) {
				return $posted;
			}
		}

		return $this->get_default_bank();
	}

	/**
	 * @param WC_Order $order  Order.
	 * @param array    $data   Checkout data.
	 */
	public function capture_classic_checkout_bank( $order, $data ) {
		if ( ! $order instanceof WC_Order || $order->get_payment_method() !== $this->id ) {
			return;
		}

		$bank = $this->resolve_checkout_bank();
		$order->update_meta_data( '_laripay_bank', $bank );
	}

	/**
	 * @param WC_Order         $order   Order.
	 * @param WP_REST_Request  $request Request.
	 */
	public function capture_store_api_bank( $order, $request ) {
		if ( ! $order instanceof WC_Order || $order->get_payment_method() !== $this->id ) {
			return;
		}

		if ( ! $request instanceof WP_REST_Request ) {
			return;
		}

		$payment_data = $request->get_param( 'payment_data' );
		if ( ! is_array( $payment_data ) || empty( $payment_data['georgia_pay_bank'] ) ) {
			return;
		}

		$bank = sanitize_text_field( $payment_data['georgia_pay_bank'] );
		if ( georgia_pay_is_valid_bank( $bank ) ) {
			$order->update_meta_data( '_laripay_bank', $bank );
		}
	}

	/**
	 * @return bool
	 */
	public function validate_fields() {
		if ( ! isset( $_POST['georgia_pay_bank'] ) ) {
			return true;
		}

		$bank = sanitize_text_field( wp_unslash( $_POST['georgia_pay_bank'] ) );
		if ( ! georgia_pay_is_valid_bank( $bank ) ) {
			wc_add_notice( __( 'Please select a valid bank for payment.', 'georgia-pay' ), 'error' );
			return false;
		}

		return true;
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
			// Same thank-you URL for cancel/fail so ?laripay=failed can update the order.
			$cancel_url = $return_url;
			$bank       = $this->resolve_checkout_bank( $order );

			$order->update_meta_data( '_laripay_bank', $bank );
			$order->save();

			$session = $client->create_checkout_session(
				(float) $order->get_total(),
				$return_url,
				$cancel_url,
				(string) $order_id,
				$bank
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
	 * Inline checkout icon markup.
	 *
	 * @return string
	 */
	protected function get_checkout_icon_html() {
		return '<span class="georgia-pay-icon-inline">'
			. '<span class="gp-pill">LariPay</span>'
			. '<span class="gp-banks-mini">TBC · BOG · Liberty</span>'
			. '</span>';
	}

	/**
	 * Show secure payment note below the payment method in checkout.
	 */
	public function payment_fields() {
		$desc = $this->get_description();
		echo '<div class="georgia-pay-secure-note">';
		echo '<div class="gp-lock"><svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg></div>';
		echo '<div class="gp-details">';
		if ( $desc ) {
			echo '<p>' . wp_kses_post( $desc ) . '</p>';
		}
		echo '<p style="font-size:11px;color:#64748b;margin:4px 0 0;">'
			. esc_html__( 'Your card data is processed directly by the bank. LariPay never sees your card number.', 'georgia-pay' )
			. '</p>';
		echo '</div></div>';

		$default_bank = $this->get_default_bank();
		$banks        = georgia_pay_bank_options();

		echo '<fieldset class="georgia-pay-bank-picker">';
		echo '<legend>' . esc_html__( 'Choose your bank', 'georgia-pay' ) . '</legend>';
		echo '<div class="georgia-pay-bank-grid">';

		foreach ( $banks as $bank_id => $bank_label ) {
			$checked = checked( $bank_id, $default_bank, false );
			printf(
				'<label class="georgia-pay-bank-option"><input type="radio" name="georgia_pay_bank" value="%1$s"%2$s /><span>%3$s</span></label>',
				esc_attr( $bank_id ),
				$checked,
				esc_html( $bank_label )
			);
		}

		echo '</div></fieldset>';
	}

	/**
	 * Custom admin options with LariPay header.
	 */
	public function admin_options() {
		echo '<div class="laripay-admin-header">';
		echo '<div class="laripay-logo">L</div>';
		echo '<div class="laripay-info">';
		echo '<h2>LariPay.ai</h2>';
		echo '<p>' . esc_html__( 'Pay via LariPay.ai: TBC, BOG, Liberty, Credo, Cartu, Basis, Flitt. Bank-hosted card checkout.', 'georgia-pay' ) . '</p>';
		echo '</div>';
		echo '<span class="laripay-badge">v' . esc_html( GEORGIA_PAY_VERSION ) . '</span>';
		echo '</div>';

		echo '<table class="form-table">';
		$this->generate_settings_html();
		echo '</table>';
	}

	/**
	 * @param int $order_id Order ID.
	 */
	public function handle_return( $order_id ) {
		$order = wc_get_order( $order_id );

		if ( ! $order || $order->get_payment_method() !== $this->id ) {
			return;
		}

		$result = Georgia_Pay_Return_Handler::get_return_result();

		if ( $result ) {
			Georgia_Pay_Return_Handler::render_notice( $order );
			return;
		}

		if ( $order->is_paid() ) {
			Georgia_Pay_Return_Handler::render_notice( $order );
			return;
		}

		if ( 'failed' === $order->get_status() ) {
			Georgia_Pay_Return_Handler::render_notice( $order );
			return;
		}

		if ( Georgia_Pay_Return_Handler::poll_session_and_complete( $order, $this->get_laripay_client() ) ) {
			Georgia_Pay_Return_Handler::render_notice( $order );
			return;
		}

		self::echo_notice(
			'pending',
			__( 'Payment pending', 'georgia-pay' ),
			__( 'We could not confirm your payment yet. If you completed payment at the bank, confirmation may arrive shortly.', 'georgia-pay' )
		);
	}

	/**
	 * @param string $type    pending notice type.
	 * @param string $title   Heading.
	 * @param string $message Body text.
	 */
	protected function echo_notice( $type, $title, $message ) {
		printf(
			'<div class="georgia-pay-result georgia-pay-result--%1$s" role="status"><div class="georgia-pay-result__icon" aria-hidden="true"></div><div class="georgia-pay-result__body"><strong class="georgia-pay-result__title">%2$s</strong><p class="georgia-pay-result__message">%3$s</p></div></div>',
			esc_attr( $type ),
			esc_html( $title ),
			esc_html( $message )
		);
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
