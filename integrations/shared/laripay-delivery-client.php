<?php
/**
 * Shared LariPay.ai delivery API client (rates, shipments, tracking).
 *
 * @package LariPayDelivery
 */

if ( ! defined( 'ABSPATH' ) && ! defined( 'LARIPAY_DELIVERY_STANDALONE' ) ) {
	// Standalone include from CS-Cart / OpenCart / PrestaShop.
}

class LariPay_Delivery_Client {

	/** @var string */
	private $api_base;

	/** @var string */
	private $secret_key;

	/** @var string */
	private $integration;

	/** @var string|null */
	private $integration_ref;

	/**
	 * @param string      $api_base        LariPay host.
	 * @param string      $secret_key      sk_test_... or sk_live_...
	 * @param string      $integration     woocommerce|cscart|opencart|prestashop|shopify|api
	 * @param string|null $integration_ref Store URL.
	 */
	public function __construct( $api_base, $secret_key, $integration = 'api', $integration_ref = null ) {
		$this->api_base        = rtrim( $api_base, '/' );
		$this->secret_key      = $secret_key;
		$this->integration     = $integration;
		$this->integration_ref = $integration_ref;
	}

	/**
	 * @return array
	 * @throws Exception
	 */
	public function list_carriers() {
		return $this->request( 'GET', '/api/v1/delivery/carriers' );
	}

	/**
	 * @param array       $from   Origin address.
	 * @param array       $to     Destination address.
	 * @param float|null  $weight_kg Weight.
	 * @param string|null $carrier Carrier id.
	 * @return array
	 * @throws Exception
	 */
	public function get_rates( $from, $to, $weight_kg = null, $carrier = null ) {
		$body = array(
			'from' => $from,
			'to'   => $to,
		);
		if ( null !== $weight_kg ) {
			$body['weight_kg'] = (float) $weight_kg;
		}
		if ( $carrier ) {
			$body['carrier'] = $carrier;
		}
		return $this->request( 'POST', '/api/v1/delivery/rates', $body );
	}

	/**
	 * @param array $payload Shipment payload.
	 * @return array
	 * @throws Exception
	 */
	public function create_shipment( $payload ) {
		if ( ! isset( $payload['metadata'] ) ) {
			$payload['metadata'] = array();
		}
		$payload['metadata']['integration'] = $this->integration;
		if ( $this->integration_ref ) {
			$payload['metadata']['site'] = $this->integration_ref;
		}
		return $this->request( 'POST', '/api/v1/delivery/shipments', $payload );
	}

	/**
	 * @param string $shipment_id LariPay shipment id.
	 * @param bool   $live_track  Refresh from carrier.
	 * @return array
	 * @throws Exception
	 */
	public function get_shipment( $shipment_id, $live_track = false ) {
		$path = '/api/v1/delivery/shipments/' . rawurlencode( $shipment_id );
		if ( $live_track ) {
			$path .= '?track=1';
		}
		return $this->request( 'GET', $path );
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
				'Content-Type'                => 'application/json',
				'Accept'                      => 'application/json',
				'X-LariPay-Integration'       => $this->integration,
				'X-LariPay-Integration-Ref'   => $this->integration_ref ? (string) $this->integration_ref : '',
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
		}

		$data = json_decode( $raw, true );
		if ( ! is_array( $data ) ) {
			throw new Exception( 'Invalid JSON from LariPay delivery API' );
		}
		if ( $code < 200 || $code >= 300 ) {
			$msg = isset( $data['error']['message'] ) ? $data['error']['message'] : "HTTP $code";
			throw new Exception( $msg );
		}
		return $data;
	}
}
