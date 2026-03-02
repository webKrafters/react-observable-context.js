import type {
	FC,
	ReactElement,
	ReactNode
} from 'react';

import type { Prehooks, Store } from '../..';

import { TestState } from './normal';

import React, {
	useCallback,
	useEffect,
	useRef,
	useState
} from 'react';

import isEmpty from 'lodash.isempty';

import {
	createContext,
	ObservableContext as ObservableContextType
} from '..';

import {
	CapitalizedDisplay as CapitalizedText,
	defaultState
} from './normal';

export const {
	App,
	CapitalizedDisplay, CustomerPhoneDisplay,
	Editor, Reset, TallyDisplay, PriceSticker,
	Product, ProductDescription
} = createConnectedClient( createContext( defaultState as Partial<TestState> ) );

export default App;

export function createConnectedClient(
	ObservableContext : ObservableContextType<Partial<TestState>>
) {

	const Reset : FC<Store<Partial<TestState>>> = ({ resetState }) => {
		useEffect(() => console.log( 'Reset component rendered.....' ));
		const reset = useCallback(() => resetState(), []);
		return ( <button onClick={ reset }>reset context</button> );
	};
	Reset.displayName = 'Reset';

	const ConnectedReset = ObservableContext.connect()( Reset ); 

	const CustomerPhoneDisplay : FC<{ data: { phone: string } }> = ({ data }) => {
		useEffect(() => console.log( 'CustomerPhoneDisplay component rendered.....' ));
		return `Phone: ${ data.phone ?? 'n.a.' }` as unknown as ReactElement;
	};
	CustomerPhoneDisplay.displayName = 'CustomerPhoneDisplay';

	const ConnectedCustomerPhoneDisplay = ObservableContext.connect({
		phone: 'customer.phone'
	})( CustomerPhoneDisplay );

	const TallyDisplay : FC<{
		data: Pick<TestState, "color" | "price" | "type"> & {
			name: TestState["customer"]["name"]
		}
	}> = ({ data: { color, name, price, type } }) => {
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
								<CapitalizedText text={ name.first } />
								{ ' ' }
								<CapitalizedText text={ name.last } />
							</>
						)
					}
				</div>
				<div style={{ clear: 'both', paddingLeft: 3 }}>
					<ConnectedCustomerPhoneDisplay />
				</div>
				<table>
					<tbody>
						<tr><td><label>Type:</label></td><td>
							<CapitalizedText text={ type } />
						</td></tr>
						<tr><td><label>Color:</label></td><td>
							<CapitalizedText text={ color } />
						</td></tr>
						<tr><td><label>Price:</label></td><td>{ price.toFixed( 2 ) }</td></tr>
					</tbody>
				</table>
				<div style={{ textAlign: 'right' }}>
					<ConnectedReset />
				</div>
			</div>
		);
	};
	TallyDisplay.displayName = 'TallyDisplay';

	const ConnectedTallyDisplay = ObservableContext.connect({
		color: 'color',
		name: 'customer.name',
		price: 'price',
		type: 'type'
	})( TallyDisplay );

	const Editor : FC<Store<Partial<TestState>>> = ({ setState }) => {

		const fNameInputRef = useRef<HTMLInputElement>( null );
		const lNameInputRef = useRef<HTMLInputElement>( null );
		const phoneInputRef = useRef<HTMLInputElement>( null );
		const priceInputRef = useRef<HTMLInputElement>( null );
		const colorInputRef = useRef<HTMLInputElement>( null );
		const typeInputRef = useRef<HTMLInputElement>( null );

		const updateColor = useCallback(() => setState({
			color: colorInputRef.current?.value
		}), []);
		const updateName = useCallback(() => setState({
			customer: {
				name: {
					first: fNameInputRef.current?.value,
					last: lNameInputRef.current?.value
				}
			}
		}), []);
		const updatePhone = useCallback(() => {
			const phone = phoneInputRef.current!.value;
			if( phone?.length && !/[0-9]{10}/.test( phone ) ) { return }
			setState({ customer: { phone } });
		}, []);
		const updatePrice = useCallback(() => setState({
			price: Number( priceInputRef.current?.value )
		}), []);
		const updateType = useCallback(() => setState({
			type: typeInputRef.current?.value
		}), []);

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

	const ConnectedEditor = ObservableContext.connect()( Editor );

	const ProductDescription : FC<{
		data : {
			c: ReactNode,
			t: ReactNode
		}
	}> = ({ data }) => {
		useEffect(() => console.log( 'ProductDescription component rendered.....' ));
		return (
			<div style={{ fontSize: 24 }}>
				<strong>Description:</strong> { data.c } { data.t }
			</div>
		);
	};
	ProductDescription.displayName = 'ProductDescription';
	
	const ConnectedProductDescription = ObservableContext.connect({
		c: 'color',
		t: 'type'
	})( ProductDescription );

	const PriceSticker : FC<{data: { p: number }}> = ({ data: { p } }) => {
		useEffect(() => console.log( 'PriceSticker component rendered.....' ));
		return (
			<div style={{ fontSize: 36, fontWeight: 800 }}>
				${ p.toFixed( 2 ) }
			</div>
		);
	};
	PriceSticker.displayName = 'PriceSticker';

	const ConnectedPriceSticker = ObservableContext.connect({ p: 'price' })( PriceSticker );

	const Product : React.FC<Store<Partial<TestState>> & {
		prehooks? : Prehooks<Partial<TestState>>,
		type? : string
	}> = ({ prehooks = undefined, setState, type }) => {

		useEffect(() => { ObservableContext.prehooks = prehooks! }, [ prehooks ]);
			
		useEffect(() => setState({ type }), [ type ]);

		const overridePricing = useCallback( e => setState({
				price: Number( e.target.value )
		}), [] );

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
						<ConnectedEditor />
						<ConnectedTallyDisplay />
					</div>
					<ConnectedProductDescription />
					<ConnectedPriceSticker />
				</div>
			</div>
		);
	};
	Product.displayName = 'Product';

	const ConnectedProduct = ObservableContext.connect()( Product );

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
				<ConnectedProduct type={ productType } />
			</div>
		);
	};
	App.displayName = 'App';

	return {
		App,
		CapitalizedDisplay: CapitalizedText,
		CustomerPhoneDisplay: ConnectedCustomerPhoneDisplay,
		Editor: ConnectedEditor,
		Reset: ConnectedReset,
		TallyDisplay: ConnectedTallyDisplay,
		PriceSticker: ConnectedPriceSticker,
		Product: ConnectedProduct,
		ProductDescription: ConnectedProductDescription
	};
}
