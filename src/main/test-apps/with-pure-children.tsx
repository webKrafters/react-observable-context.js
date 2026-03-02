import type { FC } from 'react';

import type { Prehooks } from '../..';

import React, {
	memo,
	useCallback,
	useEffect,
	useState
} from 'react';

import isEmpty from 'lodash.isempty';

import {
	createContext,
	ObservableContext as ObservableContextType
} from '..';

import {
	createNormalClient,
	defaultState,
	TestState
} from './normal';

export const {
	App,
	CustomerPhoneDisplay, Editor,
	Reset, TallyDisplay, PriceSticker,
	Product, ProductDescription
} = createPureClient( createContext( defaultState as Partial<TestState> ) );

export default App;

export function createPureClient(
	ObservableContext : ObservableContextType<Partial<TestState>>
) {

	const useStream = ObservableContext.useStream;

	const {
		CapitalizedDisplay,
		CustomerPhoneDisplay,
		Editor,
		PriceSticker,
		ProductDescription,
		Reset
	} = createNormalClient( ObservableContext ); 

	const MemoizedCustomerPhoneDisplay = memo( CustomerPhoneDisplay );
	const MemoizedEditor = memo( Editor );
	const MemoizedProductDescription = memo( ProductDescription );
	const MemoizedPriceSticker = memo( PriceSticker );
	const MemoizedReset = memo( Reset );

	const TallyDisplay : FC = () => {
		const { data: { color, name, price, type } } = useStream({
			color: 'color',
			name: 'customer.name',
			price: 'price',
			type: 'type'
		});
		useEffect(() => console.log( 'TallyDisplay component rendered.....' ));
		return (
			<div style={{ margin: '20px 0 10px' }}>
				<div style={{ float: 'left', fontSize: '1.75rem' }}>
					Customer:
					{ ' ' }
					{ isEmpty( name.first ) && isEmpty( name.last )
						? 'n.a.'
						: (
							<>
								<CapitalizedDisplay text={ name.first } />
								{ ' ' }
								<CapitalizedDisplay text={ name.last } />
							</>
						)
					}
				</div>
				<div style={{ clear: 'both', paddingLeft: 3 }}>
					<MemoizedCustomerPhoneDisplay />
				</div>
				<table>
					<tbody>
						<tr><td><label>Type:</label></td><td>
							<CapitalizedDisplay text={ type as unknown as string } />
						</td></tr>
						<tr><td><label>Color:</label></td><td>
							<CapitalizedDisplay text={ color as unknown as string } />
						</td></tr>
						<tr><td><label>Price:</label></td><td>{ price.toFixed( 2 ) }</td></tr>
					</tbody>
				</table>
				<div style={{ textAlign: 'right' }}>
					<MemoizedReset />
				</div>
			</div>
		);
	};
	TallyDisplay.displayName = 'TallyDisplay';

	const MemoizedTallyDisplay = memo( TallyDisplay );

	const Product : FC<{
		prehooks? : Prehooks<Partial<TestState>>,
		type : string
	}>= ({ prehooks = undefined, type }) => {

		const { setState } = useStream();
		
		useEffect(() => { ObservableContext.prehooks = prehooks! }, [ prehooks ]);
		
		useEffect(() => setState({ type }), [ type ]);
		
		const overridePricing = useCallback( e => {
			setState({ price: Number( e.target.value ) })
		}, [] );
		return (
			<div>
				<div style={{ marginBottom: 10 }}>
					<label>$ <input onKeyUp={ overridePricing } placeholder="override price here..."/></label>
				</div>
				<div>
					<div style={{
						borderBottom: '1px solid #333',
						marginBottom: 10,
						paddingBottom: 5
					}}>
						<MemoizedEditor />
						<MemoizedTallyDisplay />
					</div>
					<MemoizedProductDescription />
					<MemoizedPriceSticker />
				</div>
			</div>
		);
	};
	Product.displayName = 'Product';

	const MemoizedProduct = memo( Product );

	const App : FC = () => {

		const [ productType, setProductType ] = useState( 'Calculator' );

		const updateType = useCallback( e => setProductType( e.target.value ), [] );

		return (
			<div className="App">
				<h1>Demo</h1>
				<h2>A contrived product app.</h2>
				<div style={{ marginBottom: 10 }}>
					<label>Type: <input onKeyUp={ updateType } placeholder="override product type here..." /></label>
				</div>
				<Product type={ productType } />
			</div>
		);
	};
	App.displayName = 'App';

	return {
		App,
		Reset: MemoizedReset,
		CustomerPhoneDisplay: MemoizedCustomerPhoneDisplay,
		Editor: MemoizedEditor,
		ProductDescription: MemoizedProductDescription,
		PriceSticker: MemoizedPriceSticker,
		TallyDisplay: MemoizedTallyDisplay,
		Product: MemoizedProduct
	};
}
