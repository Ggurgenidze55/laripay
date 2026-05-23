<?php
/**
 * Shared LariPay.ai warehouse sync API client.
 *
 * @package LariPayWarehouse
 */

if ( ! defined( 'ABSPATH' ) && ! defined( 'LARIPAY_WAREHOUSE_STANDALONE' ) ) {
	// Standalone include from other platforms.
}

class LariPay_Warehouse_Client {

	/** @var string */
	private $api_base;

	/** @var string */
	private $secret_key;

	/** @var string */
	private $integration;

	/** @var string|null */
	private $integration_ref;

	public function __construct( $api_base, $secret_key, $integration = 'api', $integration_ref = null ) {
		$this->api_base        = rtrim( $api_base, '/' );
		$this->secret_key      = $secret_key;
		$this->integration     = $integration;
		$this->integration_ref = $integration_ref;
	}

	public function list_systems() {
		return $this->request( 'GET', '/api/v1/warehouse/systems' );
	}

	public function list_locations( $system = null ) {
		$path = '/api/v1/warehouse/locations';
		if ( $system ) {
			$path .= '?system=' . rawurlencode( $system );
		}
		return $this->request( 'GET', $path );
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
			$raw  = '{}';
			$code = 200;
		}

		$data = json_decode( $raw, true );
		if ( ! is_array( $data ) ) {
			throw new Exception( 'Invalid JSON from LariPay warehouse API' );
		}
		if ( $code < 200 || $code >= 300 ) {
			$msg = isset( $data['error']['message'] ) ? $data['error']['message'] : "HTTP $code";
			throw new Exception( $msg );
		}
		return $data;
	}
}
