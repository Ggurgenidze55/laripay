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
	const banks = settings.banks || {};
	const defaultBank = settings.default_bank || 'tbc';
	const chooseBankLabel = htmlEntities.decodeEntities(
		settings.choose_bank_label || 'Choose your bank'
	);

	const { useEffect, useState, createElement: el } = wpElement;

	const Content = function( props ) {
		const [ selectedBank, setSelectedBank ] = useState( defaultBank );
		const eventRegistration = props && props.eventRegistration;
		const emitResponse = props && props.emitResponse;

		useEffect(
			function() {
				if ( ! eventRegistration || ! emitResponse || ! eventRegistration.onPaymentSetup ) {
					return undefined;
				}

				const unsubscribe = eventRegistration.onPaymentSetup( function() {
					return {
						type: emitResponse.responseTypes.SUCCESS,
						meta: {
							paymentMethodData: {
								georgia_pay_bank: selectedBank,
							},
						},
					};
				} );

				return unsubscribe;
			},
			[ eventRegistration, emitResponse, selectedBank ]
		);

		return el(
			'div',
			null,
			el(
				'div',
				{ className: 'georgia-pay-secure-note' },
				el(
					'div',
					{ className: 'gp-lock' },
					el( 'svg', { viewBox: '0 0 24 24' }, el( 'path', {
						d: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z'
					} ) )
				),
				el(
					'div',
					{ className: 'gp-details' },
					el( 'p', null, description )
				)
			),
			el(
				'fieldset',
				{ className: 'georgia-pay-bank-picker' },
				el( 'legend', null, chooseBankLabel ),
				el(
					'div',
					{ className: 'georgia-pay-bank-grid' },
					Object.keys( banks ).map( function( bankId ) {
						return el(
							'label',
							{
								key: bankId,
								className:
									'georgia-pay-bank-option' +
									( selectedBank === bankId ? ' is-selected' : '' ),
							},
							el( 'input', {
								type: 'radio',
								name: 'georgia_pay_bank',
								value: bankId,
								checked: selectedBank === bankId,
								onChange: function() {
									setSelectedBank( bankId );
								},
							} ),
							el( 'span', null, banks[ bankId ] )
						);
					} )
				)
			)
		);
	};

	blocksRegistry.registerPaymentMethod( {
		name: 'georgia_pay',
		label: label,
		content: el( Content ),
		edit: el( Content ),
		canMakePayment: function() {
			return true;
		},
		ariaLabel: label,
		supports: {
			features: settings.supports || [ 'products' ]
		}
	} );
} )();
