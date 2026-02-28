import React, {
	useCallback,
	useEffect,
	useRef,
	useState
} from 'react';

import isEmpty from 'lodash.isempty';

import { createContext } from '..';
import { Prehooks, SelectorMap } from '../..';

export type TestState = {
	color: string,
	customer: {
		name: {
			first: string,
			last: string
		}
		phone: string
	},
	price: number,
	type: string
};

export const defaultState : TestState = {
	color: 'Burgundy',
	customer: {
		name: {
			first: null as unknown as string,
			last: null as unknown as string
		},
		phone: null as unknown as string
	},
	price: 22.5,
	type: ''
};

export const ObservableContext = createContext<Partial<TestState>>( defaultState );

export const useStream = ObservableContext.useStream;

export const Reset : React.FC = () => {
	const { resetState } = useStream();
	useEffect(() => console.log( 'Reset component rendered.....' ));
	const reset = useCallback(() => resetState([ '@@STATE' ]), [ resetState ]);
	return ( <button onClick={ reset }>reset context</button> );
};
Reset.displayName = 'Reset';

export const CapitalizedDisplay : React.FC<{ text: string }> = ({ text }) => {
	useEffect(() => console.log( `CapitalizedDisplay( ${ text } ) component rendered.....` ));
	return (
		<>
			{ `${ text } && ${ text[ 0 ]?.toUpperCase() }${ text.length > 1 ? text.slice( 1 ) : '' }` }
		</>
	);
};
CapitalizedDisplay.displayName = 'CapitalizedDisplay';

export const CustomerPhoneDisplay : React.FC = () => {
	const { data } = useStream({ phone: 'customer.phone' });
	useEffect(() => console.log( 'CustomerPhoneDisplay component rendered.....' ));
	return ( <>{ `Phone: ${ data.phone ?? 'n.a.' }` }</> );
};

export type Data<SELECTOR_MAP extends SelectorMap = SelectorMap> = {
    [selectorKey in keyof SELECTOR_MAP] : Readonly<unknown>
};

CustomerPhoneDisplay.displayName = 'CustomerPhoneDisplay';

export const TallyDisplay : React.FC = () => {
	const { data: {
		color, name, price, type
	} } = useStream({
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
				<CustomerPhoneDisplay />
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
				<Reset />
			</div>
		</div>
	);
};
TallyDisplay.displayName = 'TallyDisplay';

export const Editor : React.FC = () => {
	const fNameInputRef = useRef<HTMLInputElement>( null );
	const lNameInputRef = useRef<HTMLInputElement>( null );
	const phoneInputRef = useRef<HTMLInputElement>( null );
	const priceInputRef = useRef<HTMLInputElement>( null );
	const colorInputRef = useRef<HTMLInputElement>( null );
	const typeInputRef = useRef<HTMLInputElement>( null );
	const updateColor = useCallback(() => {
		ObservableContext.store.setState({
			color: colorInputRef.current!.value
		});
	}, []);
	const updateName = useCallback(() => {
		ObservableContext.store.setState({
			customer: {
				name: {
					first: fNameInputRef.current!.value,
					last: lNameInputRef.current!.value
				}
			}
		});
	}, []);
	const updatePhone = useCallback(() => {
		const phone = phoneInputRef.current!.value;
		if( phone.length && !/[0-9]{10}/.test( phone ) ) { return }
		ObservableContext.store.setState({ customer: { phone } });
	}, []);
	const updatePrice = useCallback(() => {
		ObservableContext.store.setState({
			price: Number( priceInputRef.current!.value )
		} );
	}, []);
	const updateType = useCallback(() => {
		ObservableContext.store.setState({
			type: typeInputRef.current!.value
		});
	}, []);
	useEffect(() => console.log( 'Editor component rendered.....' ));
	return (
		<fieldset style={{ margin: '10px 0' }}>
			<legend>Editor</legend>
			<h3 style={{ margin: '0.5rem 0' }}>Customer:</h3>
			<div style={{ float: 'left', margin: '10px 0' }}>
				<label htmlFor='firstName'><input ref={ fNameInputRef } placeholder="First name" /></label>
				{ ' ' }
				<label htmlFor='lastName'><input ref={ lNameInputRef } placeholder="Last name" /></label>
				{ ' ' }
				<button onClick={ updateName }>update customer</button>
			</div>
			<div style={{ clear: 'both', margin: '10px 0' }}>
				<label>New Phone: <input
					maxLength={ 10 }
					placeholder="Empty or 10-digit integer"
					ref={ phoneInputRef }
					type="number"
				/></label>
				{ ' ' }
				<button onClick={ updatePhone }>update phone</button>
			</div>
			<hr style={{ margin: '1.5rem 0' }} />
			<div style={{ margin: '10px 0' }}>
				<label>New Price: <input ref={ priceInputRef } /></label>
				{ ' ' }
				<button onClick={ updatePrice }>update price</button>
			</div>
			<div style={{ margin: '10px 0' }}>
				<label>New Color: <input ref={ colorInputRef } /></label>
				{ ' ' }
				<button onClick={ updateColor }>update color</button>
			</div>
			<div style={{ margin: '10px 0' }}>
				<label>New Type: <input ref={ typeInputRef } /></label>
				{ ' ' }
				<button onClick={ updateType }>update type</button>
			</div>
		</fieldset>
	);
};
Editor.displayName = 'Editor';

export const ProductDescription : React.FC = () => {
	const { data } = useStream({
		c: 'color', t: 'type'
	}) as unknown as {
		data: {[K in 'c'|'t']: React.ReactNode}
	};
	useEffect(() => console.log( 'ProductDescription component rendered.....' ));
	return (
		<div style={{ fontSize: 24 }}>
			<strong>Description:</strong> { data.c } { data.t }
		</div>
	);
};
ProductDescription.displayName = 'ProductDescription';

export const PriceSticker : React.FC = () => {
	const { data: { p } } = useStream({ p: 'price' });
	useEffect(() => console.log( 'PriceSticker component rendered.....' ));
	return (
		<div style={{ fontSize: 36, fontWeight: 800 }}>
			${ p.toFixed( 2 ) }
		</div>
	);
};
PriceSticker.displayName = 'PriceSticker';

export const Product : React.FC<{
	prehooks?: Prehooks, type : string
}> = ({ prehooks = undefined, type }) => {
	useEffect(() => {
		ObservableContext.prehooks = prehooks!;
	}, [ prehooks ]);
	useEffect(() => {
		ObservableContext.store.setState({ type });
	}, [ type ]);
	const overridePricing = useCallback(
		e => ObservableContext.store.setState({
			price: Number( e.target.value )
 		}), []
	);
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
					<Editor />
					<TallyDisplay />
				</div>
				<ProductDescription />
				<PriceSticker />
			</div>
		</div>
	);
};
Product.displayName = 'Product';

const App : React.FC = () => {
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
