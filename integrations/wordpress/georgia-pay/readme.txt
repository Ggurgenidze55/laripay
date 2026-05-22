=== Georgia Pay - TBC & BOG ===
Contributors: fintechpay
Tags: woocommerce, payment, georgia, tbc, bog, gel
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: MIT

Accept WooCommerce payments in Georgian Lari (GEL) via TBC Pay or Bank of Georgia.

== Description ==

* Redirect checkout to TBC Pay or BOG Pay
* Sandbox and live mode toggle
* IPN/webhook callbacks with signature verification
* GEL currency only (ISO 4217 code 981)

== Installation ==

1. Upload the `georgia-pay` folder to `/wp-content/plugins/`
2. Activate the plugin
3. Set WooCommerce currency to GEL
4. Configure credentials under WooCommerce → Settings → Payments → Georgia Pay

== Webhook URLs ==

Register at your bank merchant dashboard:

* TBC: `{site}/?wc-api=georgia_pay_tbc_ipn`
* BOG: `{site}/?wc-api=georgia_pay_bog_ipn`

== Changelog ==

= 1.0.0 =
* Initial release
