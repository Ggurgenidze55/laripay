<?php
/**
 * API endpoints and shared constants.
 *
 * @package GeorgiaPay
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Georgia_Pay_Constants
 */
class Georgia_Pay_Constants {

	const CURRENCY_CODE    = 'GEL';
	const CURRENCY_NUMERIC = 981;

	const TBC_CALLBACK_IPS = array(
		'193.104.20.44',
		'193.104.20.45',
		'185.52.80.44',
		'185.52.80.45',
	);

	const BOG_DEFAULT_PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----\n"
		. "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4RUyAw3+CdkS3ZNILQh\n"
		. "zHI9Hemo+vKB9U2BSabppkKjzjjkf+0Sm76hSMiu/HFtYhqWOESryoCDJoqffY0Q\n"
		. "1VNt25aTxbj068QNUtnxQ7KQVLA+pG0smf+EBWlS1vBEAFbIas9d8c9b9sSEkTrr\n"
		. "TYQ90WIM8bGB6S/KLVoT1a7SnzabjoLc5Qf/SLDG5fu8dH8zckyeYKdRKSBJKvh\n"
		. "xtcBuHV4f7qsynQT+f2UYbESX/TLHwT5qFWZDHZ0YUOUIvb8n7JujVSGZO9/+ll/\n"
		. "g4ZIWhC1MlJgPObDwRkRd8NFOopgxMcMsDIZIoLbWKhHVq67hdbwpAq9K9WMmEhP\n"
		. "nPwIDAQAB\n"
		. '-----END PUBLIC KEY-----';

	/**
	 * TBC API base URL.
	 *
	 * @param bool $sandbox Sandbox mode.
	 * @return string
	 */
	public static function tbc_base_url( $sandbox = false ) {
		if ( $sandbox ) {
			return 'https://test-api.tbcbank.ge/v1';
		}
		return 'https://api.tbcbank.ge/v1';
	}

	/**
	 * BOG payments API base URL.
	 *
	 * @param bool $sandbox Sandbox mode.
	 * @return string
	 */
	public static function bog_base_url( $sandbox = false ) {
		// BOG uses the same production host; sandbox credentials are issued separately.
		unset( $sandbox );
		return 'https://api.bog.ge/payments/v1';
	}

	/**
	 * BOG OAuth token URL.
	 *
	 * @param bool $sandbox Sandbox mode.
	 * @return string
	 */
	public static function bog_oauth_url( $sandbox = false ) {
		unset( $sandbox );
		return 'https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token';
	}
}
