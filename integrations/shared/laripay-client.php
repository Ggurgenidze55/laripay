<?php
/**
 * Shared LariPay.ai REST client for e-commerce integrations.
 *
 * Copy into WordPress, CS-Cart, OpenCart, PrestaShop, Magento modules.
 *
 * @package LariPay
 */

if ( ! defined( 'ABSPATH' ) && ! defined( 'LARIPAY_CLIENT_STANDALONE' ) ) {
	// Allow standalone include from other platforms.
}

class LariPay_Client {

	/** @var string */
	private $api_base;

	/** @var string */
	private $secret_key;

	/** @var string */
	private $integration;

	/** @var string|null */
	private $integration_ref;

	/**
	 * @param string      $api_base        LariPay host, e.g. https://laripay.ai
	 * @param string      $secret_key      sk_test_... or sk_live_...
	 * @param string      $integration     shopify|woocommerce|cscart|opencart|prestashop|magento|api
	 * @param string|null $integration_ref Store URL or shop domain.
	 */
	public function __construct( $api_base, $secret_key, $integration = 'api', $integration_ref = null ) {
		$this->api_base         = rtrim( $api_base, '/' );
		$this->secret_key       = $secret_key;
		$this->integration      = $integration;
		$this->integration_ref  = $integration_ref;
	}

	/**
	 * List Georgian banks for merchant.
	 *
	 * @return array
	 * @throws Exception
	 */
	public function list_banks() {
		return $this->request( 'GET', '/api/v1/banks' );
	}

	/**
	 * List banks with installment support.
	 *
	 * @return array
	 * @throws Exception
	 */
	public function list_installment_banks() {
		return $this->request( 'GET', '/api/v1/installments/banks' );
	}

	/**
	 * Create checkout session (redirect to bank-hosted page).
	 *
	 * @param float  $amount      GEL amount.
	 * @param string $success_url Return URL.
	 * @param string $cancel_url  Cancel URL.
	 * @param string $order_ref   Order reference.
	 * @param string $provider    tbc|bog|liberty|credo|cartu|basis|flitt
	 * @param array  $metadata    Optional metadata.
	 * @return array{id:string,url:string,payment_id:string,platform_fee:float,fee_mode:string}
	 * @throws Exception
	 */
	public function create_checkout_session( $amount, $success_url, $cancel_url, $order_ref, $provider = 'tbc', $metadata = array() ) {
		$body = array(
			'amount'              => round( (float) $amount, 2 ),
			'currency'            => 'GEL',
			'provider'            => $provider,
			'success_url'         => $success_url,
			'cancel_url'          => $cancel_url,
			'client_reference_id' => (string) $order_ref,
			'metadata'            => array_merge(
				array(
					'integration' => $this->integration,
				),
				$metadata
			),
		);

		if ( $this->integration_ref ) {
			$body['metadata']['site'] = $this->integration_ref;
		}

		$data = $this->request( 'POST', '/api/v1/checkout/sessions', $body );

		if ( empty( $data['url'] ) || empty( $data['id'] ) ) {
			$msg = isset( $data['error']['message'] ) ? $data['error']['message'] : 'Invalid LariPay checkout response';
			throw new Exception( $msg );
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
	 * Create installment checkout session (bank-hosted pay-in-parts).
	 *
	 * @param float       $amount            GEL amount.
	 * @param string      $success_url       Return URL.
	 * @param string      $cancel_url        Cancel URL.
	 * @param string      $order_ref         Order reference.
	 * @param string      $provider          Bank id.
	 * @param int|null    $installment_terms Months (optional).
	 * @param array       $metadata          Optional metadata.
	 * @return array{id:string,url:string,payment_id:string,platform_fee:float,fee_mode:string}
	 * @throws Exception
	 */
	public function create_installment_checkout_session( $amount, $success_url, $cancel_url, $order_ref, $provider = 'tbc', $installment_terms = null, $metadata = array() ) {
		$body = array(
			'amount'              => round( (float) $amount, 2 ),
			'currency'            => 'GEL',
			'provider'            => $provider,
			'success_url'         => $success_url,
			'cancel_url'          => $cancel_url,
			'client_reference_id' => (string) $order_ref,
			'metadata'            => array_merge(
				array(
					'integration'  => $this->integration,
					'payment_mode' => 'installment',
				),
				$metadata
			),
		);

		if ( null !== $installment_terms && '' !== $installment_terms ) {
			$body['installment_terms'] = (int) $installment_terms;
		}

		if ( $this->integration_ref ) {
			$body['metadata']['site'] = $this->integration_ref;
		}

		$data = $this->request( 'POST', '/api/v1/checkout/installment-sessions', $body );

		if ( empty( $data['url'] ) || empty( $data['id'] ) ) {
			$msg = isset( $data['error']['message'] ) ? $data['error']['message'] : 'Invalid LariPay installment checkout response';
			throw new Exception( $msg );
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
	 * @param string $session_id Session id.
	 * @return array
	 * @throws Exception
	 */
	public function get_checkout_session( $session_id ) {
		return $this->request( 'GET', '/api/v1/checkout/sessions/' . rawurlencode( $session_id ) );
	}

	/**
	 * @param string $url Webhook URL.
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
			// Non-fatal for platform plugins.
		}
	}

	/**
	 * @param string     $method HTTP method.
	 * @param string     $path   Path.
	 * @param array|null $body   JSON body.
	 * @return array
	 * @throws Exception
	 */
	private function request( $method, $path, $body = null ) {
		$url  = $this->api_base . $path;
		$args = array(
			'method'  => $method,
			'timeout' => 45,
			'headers' => array(
				'Authorization'             => 'Bearer ' . $this->secret_key,
				'Content-Type'              => 'application/json',
				'Accept'                    => 'application/json',
				'X-LariPay-Integration'     => $this->integration,
				'X-LariPay-Integration-Ref' => $this->integration_ref ? (string) $this->integration_ref : '',
			),
		);

		if ( null !== $body ) {
			$args['body'] = function_exists( 'wp_json_encode' ) ? wp_json_encode( $body ) : json_encode( $body );
		}

		if ( function_exists( 'wp_remote_request' ) ) {
			$response = wp_remote_request( $url, $args );
			if ( is_wp_error( $response ) ) {
				throw new Exception( $response->get_error_message() );
			}
			$code = wp_remote_retrieve_response_code( $response );
			$raw  = wp_remote_retrieve_body( $response );
		} else {
			$ctx = stream_context_create(
				array(
					'http' => array(
						'method'        => $method,
						'header'        => implode(
							"\r\n",
							array(
								'Authorization: Bearer ' . $this->secret_key,
								'Content-Type: application/json',
								'Accept: application/json',
								'X-LariPay-Integration: ' . $this->integration,
								'X-LariPay-Integration-Ref: ' . ( $this->integration_ref ? $this->integration_ref : '' ),
							)
						),
						'content'       => null !== $body ? json_encode( $body ) : '',
						'timeout'       => 45,
						'ignore_errors' => true,
					),
				)
			);
			$raw  = file_get_contents( $url, false, $ctx );
			$code = 200;
			if ( isset( $http_response_header[0] ) && preg_match( '/\s(\d{3})\s/', $http_response_header[0], $m ) ) {
				$code = (int) $m[1];
			}
		}

		$data = json_decode( $raw, true );
		if ( ! is_array( $data ) ) {
			throw new Exception( 'Invalid JSON from LariPay API' );
		}
		if ( $code < 200 || $code >= 300 ) {
			$msg = isset( $data['error']['message'] ) ? $data['error']['message'] : "HTTP $code";
			throw new Exception( $msg );
		}
		return $data;
	}
}
