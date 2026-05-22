<?php
/**
 * TBC Pay & BOG Pay API client (reads WooCommerce gateway settings).
 *
 * @package GeorgiaPay
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Georgia_Pay_API
 */
class Georgia_Pay_API {

	/** @var array */
	private $settings;

	/** @var string|null */
	private $token;

	/** @var int */
	private $token_expires = 0;

	/**
	 * @param array $settings Gateway settings from WC_Georgia_Pay_Gateway.
	 */
	public function __construct( $settings ) {
		$this->settings = $settings;
	}

	/**
	 * Whether sandbox mode is enabled.
	 *
	 * @return bool
	 */
	public function is_sandbox() {
		return 'yes' === ( $this->settings['testmode'] ?? 'no' );
	}

	/**
	 * Active bank: tbc or bog.
	 *
	 * @return string
	 */
	public function get_bank() {
		return isset( $this->settings['bank'] ) ? $this->settings['bank'] : 'tbc';
	}

	/**
	 * Create payment and return redirect URL + bank reference.
	 *
	 * @param WC_Order $order       Order.
	 * @param string   $return_url  Customer return URL.
	 * @param string   $callback_url IPN/webhook URL.
	 * @return array{redirect: string, reference: string, bank: string}
	 * @throws Exception On API failure.
	 */
	public function create_payment( $order, $return_url, $callback_url ) {
		$amount   = (float) $order->get_total();
		$order_id = (string) $order->get_id();

		if ( 'bog' === $this->get_bank() ) {
			return $this->create_bog_order( $amount, $order_id, $return_url, $callback_url );
		}

		return $this->create_tbc_payment( $amount, $order_id, $return_url, $callback_url );
	}

	/**
	 * Fetch payment status from the bank.
	 *
	 * @param string $reference Bank payment/order ID.
	 * @return array
	 * @throws Exception On API failure.
	 */
	public function get_status( $reference ) {
		if ( 'bog' === $this->get_bank() ) {
			return $this->get_bog_order( $reference );
		}
		return $this->get_tbc_payment( $reference );
	}

	/**
	 * @param float  $amount       Amount.
	 * @param string $order_id     WC order ID.
	 * @param string $return_url   Return URL.
	 * @param string $callback_url Callback URL.
	 * @return array
	 * @throws Exception On failure.
	 */
	private function create_tbc_payment( $amount, $order_id, $return_url, $callback_url ) {
		$payload = array(
			'amount'            => array(
				'currency' => Georgia_Pay_Constants::CURRENCY_CODE,
				'total'    => $amount,
			),
			'returnurl'         => $return_url,
			'callbackUrl'       => $callback_url,
			'merchantPaymentId' => $order_id,
			'language'          => 'EN',
			'preAuth'           => false,
			'description'       => sprintf( 'Order #%s', $order_id ),
		);

		$response = $this->tbc_request( 'POST', '/tpay/payments', $payload );
		$redirect = self::extract_tbc_redirect( $response );

		if ( empty( $redirect ) ) {
			throw new Exception( 'TBC Pay did not return a redirect URL.' );
		}

		return array(
			'redirect'  => $redirect,
			'reference' => isset( $response['payId'] ) ? $response['payId'] : '',
			'bank'      => 'tbc',
		);
	}

	/**
	 * @param float  $amount       Amount.
	 * @param string $order_id     WC order ID.
	 * @param string $return_url   Return URL.
	 * @param string $callback_url Callback URL.
	 * @return array
	 * @throws Exception On failure.
	 */
	private function create_bog_order( $amount, $order_id, $return_url, $callback_url ) {
		$payload = array(
			'callback_url'      => $callback_url,
			'external_order_id' => $order_id,
			'purchase_units'    => array(
				'currency'     => Georgia_Pay_Constants::CURRENCY_CODE,
				'total_amount' => $amount,
				'basket'       => array(
					array(
						'product_id' => 'order-' . $order_id,
						'quantity'   => 1,
						'unit_price' => $amount,
					),
				),
			),
			'redirect_urls'     => array(
				'success' => $return_url,
				'fail'    => $return_url,
			),
		);

		$response = $this->bog_request( 'POST', '/ecommerce/orders', $payload );
		$redirect = isset( $response['_links']['redirect']['href'] ) ? $response['_links']['redirect']['href'] : '';

		if ( empty( $redirect ) ) {
			throw new Exception( 'BOG Pay did not return a redirect URL.' );
		}

		return array(
			'redirect'  => $redirect,
			'reference' => isset( $response['id'] ) ? $response['id'] : '',
			'bank'      => 'bog',
		);
	}

	/**
	 * @param string $pay_id Payment ID.
	 * @return array
	 * @throws Exception On failure.
	 */
	private function get_tbc_payment( $pay_id ) {
		$data = $this->tbc_request( 'GET', '/tpay/payments/' . rawurlencode( $pay_id ) );
		return array(
			'bank'   => 'tbc',
			'status' => isset( $data['status'] ) ? $data['status'] : '',
			'raw'    => $data,
		);
	}

	/**
	 * @param string $order_id BOG order ID.
	 * @return array
	 * @throws Exception On failure.
	 */
	private function get_bog_order( $order_id ) {
		$data = $this->bog_request( 'GET', '/receipt/' . rawurlencode( $order_id ) );
		$key  = '';
		if ( isset( $data['order_status']['key'] ) ) {
			$key = $data['order_status']['key'];
		}
		return array(
			'bank'   => 'bog',
			'status' => $key,
			'raw'    => $data,
		);
	}

	/**
	 * @param array $response TBC response.
	 * @return string|null
	 */
	public static function extract_tbc_redirect( $response ) {
		if ( empty( $response['links'] ) || ! is_array( $response['links'] ) ) {
			return null;
		}
		foreach ( $response['links'] as $link ) {
			if ( isset( $link['rel'] ) && 'approval_url' === $link['rel'] ) {
				return isset( $link['uri'] ) ? $link['uri'] : null;
			}
		}
		return null;
	}

	/**
	 * @param string     $method HTTP method.
	 * @param string     $path   Path.
	 * @param array|null $body   Body.
	 * @return array
	 * @throws Exception On failure.
	 */
	private function tbc_request( $method, $path, $body = null ) {
		$token   = $this->get_tbc_token();
		$base    = Georgia_Pay_Constants::tbc_base_url( $this->is_sandbox() );
		$api_key = isset( $this->settings['tbc_api_key'] ) ? $this->settings['tbc_api_key'] : '';

		$headers = array(
			'Authorization: Bearer ' . $token,
			'Accept: application/json',
		);
		if ( $api_key ) {
			$headers[] = 'apikey: ' . $api_key;
		}
		if ( null !== $body ) {
			$headers[] = 'Content-Type: application/json';
		}

		return $this->http( $base . $path, $method, $headers, $body );
	}

	/**
	 * @return string
	 * @throws Exception On failure.
	 */
	private function get_tbc_token() {
		if ( $this->token && time() < $this->token_expires - 60 ) {
			return $this->token;
		}

		$base        = Georgia_Pay_Constants::tbc_base_url( $this->is_sandbox() );
		$api_key     = isset( $this->settings['tbc_api_key'] ) ? $this->settings['tbc_api_key'] : '';
		$client_id   = isset( $this->settings['tbc_client_id'] ) ? $this->settings['tbc_client_id'] : '';
		$secret      = isset( $this->settings['tbc_client_secret'] ) ? $this->settings['tbc_client_secret'] : '';
		$body_string = http_build_query(
			array(
				'client_id'     => $client_id,
				'client_secret' => $secret,
			)
		);

		$headers = array( 'Content-Type: application/x-www-form-urlencoded' );
		if ( $api_key ) {
			$headers[] = 'apikey: ' . $api_key;
		}

		$data = $this->http( $base . '/tpay/access-token', 'POST', $headers, $body_string, false );

		if ( empty( $data['access_token'] ) ) {
			throw new Exception( 'TBC Pay authentication failed.' );
		}

		$this->token         = $data['access_token'];
		$this->token_expires = time() + (int) ( isset( $data['expires_in'] ) ? $data['expires_in'] : 86400 );

		return $this->token;
	}

	/**
	 * @param string     $method HTTP method.
	 * @param string     $path   Path.
	 * @param array|null $body   Body.
	 * @return array
	 * @throws Exception On failure.
	 */
	private function bog_request( $method, $path, $body = null ) {
		$token = $this->get_bog_token();
		$base  = Georgia_Pay_Constants::bog_base_url( $this->is_sandbox() );

		$headers = array(
			'Authorization: Bearer ' . $token,
			'Accept: application/json',
		);
		if ( null !== $body ) {
			$headers[] = 'Content-Type: application/json';
		}

		return $this->http( $base . $path, $method, $headers, $body );
	}

	/**
	 * @return string
	 * @throws Exception On failure.
	 */
	private function get_bog_token() {
		if ( $this->token && time() < $this->token_expires - 60 ) {
			return $this->token;
		}

		$client_id = isset( $this->settings['bog_client_id'] ) ? $this->settings['bog_client_id'] : '';
		$secret    = isset( $this->settings['bog_client_secret'] ) ? $this->settings['bog_client_secret'] : '';
		$oauth_url = Georgia_Pay_Constants::bog_oauth_url( $this->is_sandbox() );

		$credentials = base64_encode( $client_id . ':' . $secret );
		$headers     = array(
			'Content-Type: application/x-www-form-urlencoded',
			'Authorization: Basic ' . $credentials,
		);

		$data = $this->http(
			$oauth_url,
			'POST',
			$headers,
			http_build_query( array( 'grant_type' => 'client_credentials' ) ),
			false
		);

		if ( empty( $data['access_token'] ) ) {
			throw new Exception( 'BOG Pay authentication failed.' );
		}

		$this->token         = $data['access_token'];
		$expires             = (int) ( isset( $data['expires_in'] ) ? $data['expires_in'] : 3600 );
		if ( $expires > 86400 ) {
			$expires = 3600;
		}
		$this->token_expires = time() + $expires;

		return $this->token;
	}

	/**
	 * @param string          $url       URL.
	 * @param string          $method    Method.
	 * @param array           $headers   Headers.
	 * @param array|string|null $body    Body.
	 * @param bool            $json_body Encode body as JSON.
	 * @return array
	 * @throws Exception On failure.
	 */
	private function http( $url, $method, $headers, $body = null, $json_body = true ) {
		if ( ! function_exists( 'curl_init' ) ) {
			throw new Exception( 'PHP cURL extension is required.' );
		}

		$ch = curl_init( $url );
		$opts = array(
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_CUSTOMREQUEST  => $method,
			CURLOPT_HTTPHEADER     => $headers,
			CURLOPT_TIMEOUT        => 30,
		);

		if ( null !== $body ) {
			if ( $json_body && is_array( $body ) ) {
				$opts[ CURLOPT_POSTFIELDS ] = wp_json_encode( $body );
			} else {
				$opts[ CURLOPT_POSTFIELDS ] = $body;
			}
		}

		curl_setopt_array( $ch, $opts );
		$response = curl_exec( $ch );
		$status   = (int) curl_getinfo( $ch, CURLINFO_HTTP_CODE );
		$error    = curl_error( $ch );
		curl_close( $ch );

		if ( false === $response ) {
			throw new Exception( 'HTTP request failed: ' . $error );
		}

		$data = json_decode( $response, true );
		if ( ! is_array( $data ) ) {
			$data = array();
		}

		if ( $status < 200 || $status >= 300 ) {
			$message = $response;
			if ( isset( $data['developerMessage'] ) ) {
				$message = $data['developerMessage'];
			} elseif ( isset( $data['userMessage'] ) ) {
				$message = $data['userMessage'];
			}
			throw new Exception( sprintf( 'Bank API error (%d): %s', $status, $message ) );
		}

		return $data;
	}
}
