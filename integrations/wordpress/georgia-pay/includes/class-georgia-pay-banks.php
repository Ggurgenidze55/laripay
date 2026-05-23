<?php
/**
 * Georgian banks supported by LariPay.ai (bank-hosted card checkout).
 *
 * @package GeorgiaPay
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * @return array<string, string> id => label
 */
function georgia_pay_bank_options() {
	return array(
		'tbc'     => __( 'TBC Pay', 'georgia-pay' ),
		'bog'     => __( 'BOG Pay (Bank of Georgia)', 'georgia-pay' ),
		'liberty' => __( 'Liberty Bank', 'georgia-pay' ),
		'credo'   => __( 'Credo Bank', 'georgia-pay' ),
		'cartu'   => __( 'Cartu Bank', 'georgia-pay' ),
		'basis'   => __( 'Basis Bank', 'georgia-pay' ),
		'flitt'   => __( 'Flitt (aggregator)', 'georgia-pay' ),
	);
}

/**
 * @param string $provider Bank id.
 * @return bool
 */
function georgia_pay_is_valid_bank( $provider ) {
	return array_key_exists( $provider, georgia_pay_bank_options() );
}
