( function() {
	const blocksRegistry = window.wc && window.wc.wcBlocksRegistry;
	const settingsApi = window.wc && window.wc.wcSettings;
	const wpElement = window.wp && window.wp.element;
	const htmlEntities = window.wp && window.wp.htmlEntities;

	if ( ! blocksRegistry || ! settingsApi || ! wpElement || ! htmlEntities ) {
		return;
	}

	const settings = settingsApi.getSetting( 'georgia_pay_data', {} );
	const label = htmlEntities.decodeEntities( settings.title || 'Pay with card (GEL)' );
	const description = htmlEntities.decodeEntities(
		settings.description || 'Secure payment via Georgian banks (LariPay.ai).'
	);

	const Content = function() {
		return wpElement.createElement(
			'div',
			{ className: 'georgia-pay-secure-note' },
			wpElement.createElement(
				'div',
				{ className: 'gp-lock' },
				wpElement.createElement(
					'svg',
					{ viewBox: '0 0 24 24' },
					wpElement.createElement( 'path', {
						d: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z'
					} )
				)
			),
			wpElement.createElement(
				'div',
				{ className: 'gp-details' },
				wpElement.createElement( 'p', null, description ),
				wpElement.createElement(
					'div',
					{ className: 'bank-logos' },
					wpElement.createElement( 'span', null, 'TBC' ),
					wpElement.createElement( 'span', null, 'BOG' ),
					wpElement.createElement( 'span', null, 'Liberty' ),
					wpElement.createElement( 'span', null, 'Credo' ),
					wpElement.createElement( 'span', null, 'Cartu' ),
					wpElement.createElement( 'span', null, 'Basis' ),
					wpElement.createElement( 'span', null, 'Flitt' )
				)
			)
		);
	};

	blocksRegistry.registerPaymentMethod( {
		name: 'georgia_pay',
		label: label,
		content: wpElement.createElement( Content ),
		edit: wpElement.createElement( Content ),
		canMakePayment: function() {
			return true;
		},
		ariaLabel: label,
		supports: {
			features: settings.supports || [ 'products' ]
		}
	} );
} )();

