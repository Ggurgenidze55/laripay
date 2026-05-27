<?php
/**
 * WooCommerce Blocks checkout support.
 *
 * @package GeorgiaPay
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( '\Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType' ) ) {
	return;
}

use Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType;

/**
 * Class Georgia_Pay_Blocks_Support
 */
final class Georgia_Pay_Blocks_Support extends AbstractPaymentMethodType {

	/**
	 * Gateway name in block registry.
	 *
	 * @var string
	 */
	protected $name = 'georgia_pay';

	/**
	 * Gateway settings.
	 *
	 * @var array
	 */
	private $settings = array();

	/**
	 * Initialize.
	 */
	public function initialize() {
		$this->settings = get_option( 'woocommerce_georgia_pay_settings', array() );
	}

	/**
	 * Check if gateway should be active in blocks checkout.
	 *
	 * @return bool
	 */
	public function is_active() {
		$enabled = isset( $this->settings['enabled'] ) && 'yes' === $this->settings['enabled'];
		$key     = isset( $this->settings['laripay_secret_key'] ) ? trim( (string) $this->settings['laripay_secret_key'] ) : '';
		$currency = get_woocommerce_currency();

		return $enabled && ! empty( $key ) && 'GEL' === $currency;
	}

	/**
	 * Register frontend script for checkout blocks.
	 *
	 * @return string[]
	 */
	public function get_payment_method_script_handles() {
		$script_path = GEORGIA_PAY_PATH . 'assets/js/blocks.js';
		$script_url  = GEORGIA_PAY_URL . 'assets/js/blocks.js';

		wp_register_script(
			'georgia-pay-blocks',
			$script_url,
			array( 'wc-blocks-registry', 'wc-settings', 'wp-element', 'wp-html-entities' ),
			file_exists( $script_path ) ? filemtime( $script_path ) : GEORGIA_PAY_VERSION,
			true
		);

		return array( 'georgia-pay-blocks' );
	}

	/**
	 * Expose gateway data to blocks checkout.
	 *
	 * @return array
	 */
	public function get_payment_method_data() {
		$title = isset( $this->settings['title'] ) && $this->settings['title']
			? $this->settings['title']
			: __( 'Pay with card (GEL)', 'georgia-pay' );

		$description = isset( $this->settings['description'] ) && $this->settings['description']
			? $this->settings['description']
			: __( 'Secure payment via Georgian banks (LariPay.ai).', 'georgia-pay' );

		return array(
			'title'       => $title,
			'description' => $description,
			'supports'    => array( 'products' ),
		);
	}
}

