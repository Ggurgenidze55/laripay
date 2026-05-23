<?php
/**
 * LariPay.ai warehouse sync REST client.
 *
 * @package GeorgiaWarehouse
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Georgia_Warehouse_LariPay_Client {

	/** @var string */
	private $api_base;

	/** @var string */
	private $secret_key;

	public function __construct( $api_base, $secret_key ) {
		$this->api_base   = rtrim( $api_base, '/' );
		$this->secret_key = $secret_key;
	}

	public function sync_products( $payload ) {
		return $this->request( 'POST', '/api/v1/warehouse/sync/products', $payload );
	}

	public function sync_stock( $payload ) {
		return $this->request( 'POST', '/api/v1/warehouse/sync/stock', $payload );
	}

	public function sync_orders( $payload ) {
		return $this->request( 'POST', '/api/v1/warehouse/sync/orders', $payload );
	}

	public function get_sync_job( $job_id ) {
		return $this->request( 'GET', '/api/v1/warehouse/sync/jobs/' . rawurlencode( $job_id ) );
	}

	private function request( $method, $path, $body = null ) {
		$url  = $this->api_base . $path;
		$args = array(
			'method'  => $method,
			'timeout' => 120,
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
			throw new Exception( 'Invalid JSON from LariPay.ai warehouse API' );
		}
		if ( $code < 200 || $code >= 300 ) {
			$msg = isset( $data['error']['message'] ) ? $data['error']['message'] : "HTTP $code";
			throw new Exception( $msg );
		}
		return $data;
	}
}
