<?php
/**
 * WooCommerce gateway — LariPay.ai online installments (bank-hosted).
 *
 * @package GeorgiaPay
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class WC_Georgia_Pay_Installments_Gateway
 */
class WC_Georgia_Pay_Installments_Gateway extends WC_Georgia_Pay_Gateway {

	/** @var int|null */
	public $installment_terms;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->id                 = 'georgia_pay_installments';
		$this->method_title       = __( 'LariPay.ai — Online installments (GEL)', 'georgia-pay' );
		$this->method_description = __( 'Pay in parts via Georgian banks (TBC, BOG, Liberty, Credo, Cartu, Basis, Flitt). Bank-hosted installment flow.', 'georgia-pay' );

		$this->init_form_fields();
		$this->init_settings();

		$this->title             = $this->get_option( 'title' );
		$this->description       = $this->get_option( 'description' );
		$this->enabled           = $this->get_option( 'enabled' );
		$this->bank              = $this->get_option( 'bank', 'tbc' );
		$this->installment_terms = $this->get_option( 'installment_terms', '' );
		if ( '' === $this->installment_terms ) {
			$this->installment_terms = null;
		} else {
			$this->installment_terms = (int) $this->installment_terms;
		}

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
	}

	/**
	 * Admin settings.
	 */
	public function init_form_fields() {
		parent::init_form_fields();

		$this->form_fields['title']['default']       = __( 'Pay in installments (GEL)', 'georgia-pay' );
		$this->form_fields['description']['default'] = __( 'Split your purchase into monthly payments via a Georgian bank (LariPay.ai).', 'georgia-pay' );
		$this->form_fields['enabled']['label']       = __( 'Enable LariPay.ai installments', 'georgia-pay' );

		$this->form_fields['installment_terms'] = array(
			'title'       => __( 'Installment term (months)', 'georgia-pay' ),
			'type'        => 'select',
			'description' => __( 'Leave empty to let the customer choose on the bank page.', 'georgia-pay' ),
			'default'     => '',
			'options'     => array(
				''   => __( 'Customer chooses on bank page', 'georgia-pay' ),
				'3'  => '3',
				'6'  => '6',
				'12' => '12',
				'24' => '24',
				'36' => '36',
			),
		);
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
			$cancel_url = $return_url;
			$bank       = $this->resolve_checkout_bank( $order );

			$order->update_meta_data( '_laripay_bank', $bank );
			$order->save();

			$session = $client->create_installment_checkout_session(
				(float) $order->get_total(),
				$return_url,
				$cancel_url,
				(string) $order_id,
				$bank,
				$this->installment_terms
			);

			$order->update_meta_data( '_laripay_session_id', $session['id'] );
			$order->update_meta_data( '_laripay_payment_id', $session['payment_id'] );
			$order->update_meta_data( '_laripay_payment_mode', 'installment' );
			$order->save();

			$order->update_status(
				'pending',
				sprintf(
					/* translators: 1: session id */
					__( 'Awaiting LariPay.ai installment payment (session %s).', 'georgia-pay' ),
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
					'source'   => 'georgia-pay-installments',
					'order_id' => $order_id,
				)
			);
			wc_add_notice(
				__( 'Installment payment could not be started. Please try again.', 'georgia-pay' ),
				'error'
			);
			return array( 'result' => 'fail' );
		}
	}
}
