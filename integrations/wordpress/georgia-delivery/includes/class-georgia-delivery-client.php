<?php
/**
 * LariPay.ai delivery REST client.
 *
 * @package GeorgiaDelivery
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Georgia_Delivery_LariPay_Client {

	/** @var string */
	private $api_base;

	/** @var string */
	private $secret_key;

	public function __construct( $api_base, $secret_key ) {
		$this->api_base   = rtrim( $api_base, '/' );
		$this->secret_key = $secret_key;
	}

	/**
	 * @param array       $from Origin.
	 * @param array       $to   Destination.
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
	 * @param array $payload Shipment body.
	 * @return array
	 * @throws Exception
	 */
	public function create_shipment( $payload ) {
		$payload['metadata'] = array_merge(
			array(
				'integration' => 'woocommerce',
				'site'        => home_url(),
			),
			isset( $payload['metadata'] ) ? $payload['metadata'] : array()
		);
		return $this->request( 'POST', '/api/v1/delivery/shipments', $payload );
	}

	/**
	 * @param string     $method HTTP method.
	 * @param string     $path   Path.
	 * @param array|null $body   Body.
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
				'X-LariPay-Integration'     => 'woocommerce',
				'X-LariPay-Integration-Ref' => home_url(),
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
			throw new Exception( 'Invalid JSON from LariPay.ai delivery API' );
		}
		if ( $code < 200 || $code >= 300 ) {
			$msg = isset( $data['error']['message'] ) ? $data['error']['message'] : "HTTP $code";
			throw new Exception( $msg );
		}
		return $data;
	}
}
