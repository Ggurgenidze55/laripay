<?php
/**
 * Warehouse / ERP systems supported by LariPay.ai sync.
 *
 * @package GeorgiaWarehouse
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * @return array<string, string>
 */
function georgia_warehouse_system_options() {
	return array(
		'fina'     => __( 'Fina', 'georgia-warehouse' ),
		'fmg_soft' => __( 'FMG Soft', 'georgia-warehouse' ),
		'optimo'   => __( 'Optimo WMS', 'georgia-warehouse' ),
		'one_c'    => __( '1C:Enterprise', 'georgia-warehouse' ),
		'balance'  => __( 'Balance', 'georgia-warehouse' ),
		'libra'    => __( 'Libra Software', 'georgia-warehouse' ),
		'orbit'    => __( 'Orbit ERP', 'georgia-warehouse' ),
		'micros'   => __( 'Micros / Business', 'georgia-warehouse' ),
		'sap_b1'   => __( 'SAP Business One', 'georgia-warehouse' ),
		'logista'  => __( 'Logista WMS', 'georgia-warehouse' ),
	);
}
