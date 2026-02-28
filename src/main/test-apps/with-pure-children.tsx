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
	CapitalizedDisplay,
	CustomerPhoneDisplay,
	defaultState,
	Editor,
	ObservableContext,
	PriceSticker,
	ProductDescription,
	Reset,
	TestState,
	useStream
} from './normal';

export const MemoizedReset = memo( Reset );
export const MemoizedCustomerPhoneDisplay = memo( CustomerPhoneDisplay );
export const MemoizedEditor = memo( Editor );
export const MemoizedProductDescription = memo( ProductDescription );
export const MemoizedPriceSticker = memo( PriceSticker );

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
export const MemoizedTallyDisplay = memo( TallyDisplay );

export const Product : FC<{
	prehooks? : Prehooks<Partial<TestState>>,
	type : string
}>= ({ prehooks = undefined, type }) => {
	
	useEffect(() => { ObservableContext.prehooks = prehooks! }, [ prehooks ]);
	
	useEffect(() => ObservableContext.store.setState({ type }), [ type ]);
	
	const overridePricing = useCallback( e => {
		ObservableContext.store.setState({
			price: Number( e.target.value )
		})
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

export default App;
