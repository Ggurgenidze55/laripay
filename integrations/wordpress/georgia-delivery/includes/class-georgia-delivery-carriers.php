<?php
/**
 * Georgian delivery carriers (LariPay.ai).
 *
 * @package GeorgiaDelivery
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * @return array<string, string>
 */
function georgia_delivery_carrier_options() {
	return array(
		'delivo'        => __( 'Delivo', 'georgia-delivery' ),
		'onway'         => __( 'OnWay', 'georgia-delivery' ),
		'georgian_post' => __( 'Georgian Post', 'georgia-delivery' ),
		'glovo'         => __( 'Glovo', 'georgia-delivery' ),
		'wolt'          => __( 'Wolt Drive', 'georgia-delivery' ),
		'bolt'          => __( 'Bolt Delivery', 'georgia-delivery' ),
		'kiwipost'      => __( 'KiwiPost', 'georgia-delivery' ),
		'optimo'        => __( 'Optimo Express', 'georgia-delivery' ),
		'multiline'     => __( 'MultiLine Express', 'georgia-delivery' ),
		'dhl'           => __( 'DHL Georgia', 'georgia-delivery' ),
		'fedex'         => __( 'FedEx Georgia', 'georgia-delivery' ),
		'ups'           => __( 'UPS Georgia', 'georgia-delivery' ),
	);
}
