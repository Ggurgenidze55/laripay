<?php
/**
 * Admin settings page.
 *
 * @package GeorgiaWarehouse
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Georgia_Warehouse_Admin
 */
class Georgia_Warehouse_Admin {

	/** @var Georgia_Warehouse_Sync */
	private $sync;

	public function __construct( Georgia_Warehouse_Sync $sync ) {
		$this->sync = $sync;
		add_action( 'admin_menu', array( $this, 'menu' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_post_georgia_warehouse_pull_stock', array( $this, 'handle_pull_stock' ) );
	}

	public function menu() {
		add_submenu_page(
			'woocommerce',
			__( 'LariPay Warehouse Sync', 'georgia-warehouse' ),
			__( 'Warehouse Sync', 'georgia-warehouse' ),
			'manage_woocommerce',
			'georgia-warehouse',
			array( $this, 'render' )
		);
	}

	public function register_settings() {
		register_setting( 'georgia_warehouse', 'georgia_warehouse_settings' );
	}

	public function handle_pull_stock() {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( esc_html__( 'Unauthorized', 'georgia-warehouse' ) );
		}
		check_admin_referer( 'georgia_warehouse_pull_stock' );

		$result = $this->sync->pull_stock();
		$redirect = add_query_arg(
			array(
				'page'           => 'georgia-warehouse',
				'stock_sync'     => is_wp_error( $result ) ? 'error' : 'ok',
				'stock_sync_msg' => is_wp_error( $result )
					? $result->get_error_message()
					: sprintf(
						__( 'Updated %d products from warehouse.', 'georgia-warehouse' ),
						(int) ( $result['updated'] ?? 0 )
					),
			),
			admin_url( 'admin.php' )
		);
		wp_safe_redirect( $redirect );
		exit;
	}

	public function render() {
		$s = $this->sync->get_settings();

		if ( isset( $_GET['stock_sync'] ) && 'ok' === $_GET['stock_sync'] ) {
			echo '<div class="notice notice-success"><p>' . esc_html( wp_unslash( $_GET['stock_sync_msg'] ?? '' ) ) . '</p></div>';
		}
		if ( isset( $_GET['stock_sync'] ) && 'error' === $_GET['stock_sync'] ) {
			echo '<div class="notice notice-error"><p>' . esc_html( wp_unslash( $_GET['stock_sync_msg'] ?? '' ) ) . '</p></div>';
		}
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'LariPay.ai — Warehouse sync', 'georgia-warehouse' ); ?></h1>
			<p><?php esc_html_e( 'Sync products, stock, and orders with Fina, FMG Soft, Optimo WMS, 1C, and other Georgian warehouse systems.', 'georgia-warehouse' ); ?></p>

			<form method="post" action="options.php">
				<?php settings_fields( 'georgia_warehouse' ); ?>
				<table class="form-table">
					<tr>
						<th><?php esc_html_e( 'LariPay API URL', 'georgia-warehouse' ); ?></th>
						<td><input type="url" name="georgia_warehouse_settings[api_url]" value="<?php echo esc_attr( $s['api_url'] ); ?>" class="regular-text" /></td>
					</tr>
					<tr>
						<th><?php esc_html_e( 'Secret API key', 'georgia-warehouse' ); ?></th>
						<td><input type="password" name="georgia_warehouse_settings[secret_key]" value="<?php echo esc_attr( $s['secret_key'] ); ?>" class="regular-text" /></td>
					</tr>
					<tr>
						<th><?php esc_html_e( 'Warehouse system', 'georgia-warehouse' ); ?></th>
						<td>
							<select name="georgia_warehouse_settings[system]">
								<?php foreach ( georgia_warehouse_system_options() as $id => $label ) : ?>
									<option value="<?php echo esc_attr( $id ); ?>" <?php selected( $s['system'], $id ); ?>><?php echo esc_html( $label ); ?></option>
								<?php endforeach; ?>
							</select>
						</td>
					</tr>
					<tr>
						<th><?php esc_html_e( 'Warehouse location ID', 'georgia-warehouse' ); ?></th>
						<td><input type="text" name="georgia_warehouse_settings[warehouse_id]" value="<?php echo esc_attr( $s['warehouse_id'] ); ?>" class="regular-text" /></td>
					</tr>
					<tr>
						<th><?php esc_html_e( 'Auto push orders', 'georgia-warehouse' ); ?></th>
						<td><label><input type="checkbox" name="georgia_warehouse_settings[sync_orders]" value="yes" <?php checked( $s['sync_orders'], 'yes' ); ?> /> <?php esc_html_e( 'On Processing status', 'georgia-warehouse' ); ?></label></td>
					</tr>
				</table>
				<?php submit_button(); ?>
			</form>

			<hr />
			<h2><?php esc_html_e( 'Manual stock sync', 'georgia-warehouse' ); ?></h2>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<?php wp_nonce_field( 'georgia_warehouse_pull_stock' ); ?>
				<input type="hidden" name="action" value="georgia_warehouse_pull_stock" />
				<?php submit_button( __( 'Pull stock from warehouse now', 'georgia-warehouse' ), 'secondary' ); ?>
			</form>
		</div>
		<?php
	}
}
