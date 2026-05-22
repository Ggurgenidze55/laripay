<?php
/**
 * LariPay.ai REST API client (checkout, status).
 *
 * @package GeorgiaPay
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Georgia_Pay_LariPay_Client
 */
class Georgia_Pay_LariPay_Client {

	/** @var string */
	private $api_base;

	/** @var string */
	private $secret_key;

	/**
	 * @param string $api_base   LariPay.ai host, e.g. https://laripay.ai
	 * @param string $secret_key sk_test_... or sk_live_...
	 */
	public function __construct( $api_base, $secret_key ) {
		$this->api_base   = rtrim( $api_base, '/' );
		$this->secret_key = $secret_key;
	}

	/**
	 * Create checkout session.
	 *
	 * @param float  $amount   Amount in GEL.
	 * @param string $success_url Return URL.
	 * @param string $cancel_url  Cancel URL.
	 * @param string $order_ref   WooCommerce order ID.
	 * @param string $provider    tbc|bog.
	 * @return array{id:string,url:string,payment_id:string,platform_fee:float,fee_mode:string}
	 * @throws Exception On API error.
	 */
	public function create_checkout_session( $amount, $success_url, $cancel_url, $order_ref, $provider = 'tbc' ) {
		$body = array(
			'amount'               => round( (float) $amount, 2 ),
			'currency'             => 'GEL',
			'provider'             => $provider,
			'success_url'          => $success_url,
			'cancel_url'           => $cancel_url,
			'client_reference_id'  => (string) $order_ref,
		);

		$data = $this->request( 'POST', '/api/v1/checkout/sessions', $body );

		if ( empty( $data['url'] ) || empty( $data['id'] ) ) {
			throw new Exception( isset( $data['error']['message'] ) ? $data['error']['message'] : 'Invalid LariPay.ai checkout response' );
		}

		return array(
			'id'           => $data['id'],
			'url'          => $data['url'],
			'payment_id'   => isset( $data['payment_id'] ) ? $data['payment_id'] : '',
			'platform_fee' => isset( $data['platform_fee'] ) ? (float) $data['platform_fee'] : 0,
			'fee_mode'     => isset( $data['fee_mode'] ) ? $data['fee_mode'] : 'commission',
		);
	}

	/**
	 * Register merchant webhook at LariPay.ai (idempotent-ish).
	 *
	 * @param string $url Store webhook URL.
	 */
	public function register_webhook_endpoint( $url ) {
		try {
			$this->request(
				'POST',
				'/api/v1/webhooks',
				array(
					'url'    => $url,
					'events' => array( 'payment.succeeded', 'payment.failed', 'payment.refunded' ),
				)
			);
		} catch ( Exception $e ) {
			if ( function_exists( 'wc_get_logger' ) ) {
				wc_get_logger()->warning(
					'LariPay.ai webhook register: ' . $e->getMessage(),
					array( 'source' => 'georgia-pay' )
				);
			}
		}
	}

	/**
	 * Get checkout session status.
	 *
	 * @param string $session_id LariPay.ai session id.
	 * @return array
	 * @throws Exception On API error.
	 */
	public function get_checkout_session( $session_id ) {
		return $this->request( 'GET', '/api/v1/checkout/sessions/' . rawurlencode( $session_id ), null );
	}

	/**
	 * @param string     $method HTTP method.
	 * @param string     $path   API path.
	 * @param array|null $body   JSON body.
	 * @return array
	 * @throws Exception On failure.
	 */
	private function request( $method, $path, $body = null ) {
		$url  = $this->api_base . $path;
		$args = array(
			'method'  => $method,
			'timeout' => 45,
			'headers' => array(
				'Authorization' => 'Bearer ' . $this->secret_key,
				'Content-Type'    => 'application/json',
				'Accept'          => 'application/json',
			),
		);

		if ( null !== $body ) {
			$args['body'] = wp_json_encode( $body );
		}

		$response = wp_remote_request( $url, $args );

		if ( is_wp_error( $response ) ) {
			throw new Exception( $response->get_error_message() );
		}

		$code = wp_remote_retrieve_response_code( $response );
		$raw  = wp_remote_retrieve_body( $response );
		$data = json_decode( $raw, true );

		if ( ! is_array( $data ) ) {
			throw new Exception( 'Invalid JSON from LariPay.ai API' );
		}

		if ( $code < 200 || $code >= 300 ) {
			$msg = isset( $data['error']['message'] ) ? $data['error']['message'] : "HTTP $code";
			throw new Exception( $msg );
		}

		return $data;
	}
}

/** @deprecated */
class_alias( Georgia_Pay_LariPay_Client::class, 'Georgia_Pay_Payka_Client' );
