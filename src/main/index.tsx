import type {
	ElementType,
	FC,
	NamedExoticComponent,
	ReactNode
} from 'react';

import type {
	ConnectedComponent,
	ConnectProps,
	ExtractInjectedProps,
	IProps,
	SelectorMap,
	Store,
} from '..';

import React, {
	Children,
	cloneElement,
	createContext as _createContext,
	forwardRef,
	memo,
	useEffect,
	useRef,
	useState
} from 'react';

import isEqual from 'lodash.isequal';
import isPlainObject from 'lodash.isplainobject';
import omit from 'lodash.omit';

import {
	AutoImmutable,
	createEagleEye,
	EagleEyeContext,
	IStorage,
	Prehooks,
	State
} from "@webkrafters/eagleeye";

export class ObservableContext<T extends State> {
	private consumer : EagleEyeContext<T>;
	constructor(
		value? : T,
		prehooks? : Prehooks<T>,
		storage? : IStorage<T>
	); 
	constructor(
		value? : AutoImmutable<T>,
		prehooks? : Prehooks<T>,
		storage? : IStorage<T>
	);
	constructor( value, prehooks, storage ) {
		this.consumer = createEagleEye({ prehooks, storage, value });
	}

	get cache(){ return this.consumer.cache }

	get closed(){ return this.consumer.closed }

	get connect() { return this._connect }

	get prehooks() { return this.consumer.prehooks }

	get storage() { return this.consumer.storage }

	get store() { return this.consumer.store }

	/** 
	 * Actively monitors the store and triggers component re-render if any of the watched keys in the state objects changes
	 * 
	 * @param context - Refers to the PublicObservableContext<T> type of the ObservableContext<T>
	 * @param [selectorMap = {}] - Key:value pairs where `key` => arbitrary key given to a Store.data property holding a state slice and `value` => property path to a state slice used by this component: see examples below. May add a mapping for a certain arbitrary key='state' and value='@@STATE' to indicate a desire to obtain the entire state object and assign to a `state` property of Store.data. A change in any of the referenced properties results in this component render. When using '@@STATE', note that any change within the state object will result in this component render.
	 * @see {ObservableContext<STATE>}
	 * 
	 * @example
	 * a valid property path follows the `lodash` object property path convention.
	 * for a state = { a: 1, b: 2, c: 3, d: { e: 5, f: [6, { x: 7, y: 8, z: 9 } ] } }
	 * Any of the following is an applicable selector map.
	 * ['d', 'a'] => {
	 * 		0: { e: 5, f: [6, { x: 7, y: 8, z: 9 } ] },
	 * 		1: 1
	 * }
	 * {myData: 'd', count: 'a'} => {
	 * 		myData: { e: 5, f: [6, { x: 7, y: 8, z: 9 } ] },
	 * 		count: 1
	 * }
	 * {count: 'a'} => {count: 1} // same applies to {count: 'b'} = {count: 2}; {count: 'c'} = {count: 3}
	 * {myData: 'd'} => {mydata: { e: 5, f: [6, { x: 7, y: 8, z: 9 } ] }}
	 * {xyz: 'd.e'} => {xyz: 5}
	 * {def: 'd.e.f'} => {def: [6, { x: 7, y: 8, z: 9 } ]}
	 * {f1: 'd.e.f[0]'} or {f1: 'd.e.f.0'} => {f1: 6}
	 * {secondFElement: 'd.e.f[1]'} or {secondFElement: 'd.e.f.1'} => {secondFElement: { x: 7, y: 8, z: 9 }}
	 * {myX: 'd.e.f[1].x'} or {myX: 'd.e.f.1.x'} => {myX: 7} // same applies to {myY: 'd.e.f[1].y'} = {myY: 8}; {myZ: 'd.e.f[1].z'} = {myZ: 9}
	 * {myData: '@@STATE'} => {myData: state}
	 */
	get useStream() {
		const stream = this.consumer.stream;
		return <S extends SelectorMap>( selectorMap? : S ) => {
			const [ channel ] = useState(() => stream( selectorMap ));
			const [ store, setStore ] = useState(() => ({
				data: channel.data,
				resetState: channel.resetState.bind( channel ),
				setState: channel.setState.bind( channel )
			} as unknown as Store<T, S> ));
			useEffect(() => {
				channel.selectorMap = selectorMap;
			}, [ selectorMap ]);
			useEffect(() => {
				channel.addListener(
					'data-changed',
					() => setStore({
						...store, data: channel.data
					} as unknown as Store<T, S> )
				);
				return () => channel.endStream();
			}, []);
			return store;
		};
	}

	set prehooks( prehooks : Prehooks<T> ) {
		this.consumer.prehooks = prehooks;
	}

	set storage( storage : IStorage<T> ) {
		this.consumer.storage = storage;
	}

	/**
	 * Provides an HOC function for connecting its WrappedComponent argument to the context store.
	 *
	 * The HOC function automatically memoizes any un-memoized WrappedComponent argument.
	 *
	 * @param context - Refers to the PublicObservableContext<T> type of the ObservableContext<T>
	 * @param [selectorMap] - Key:value pairs where `key` => arbitrary key given to a Store.data property holding a state slice and `value` => property path to a state slice used by this component: see examples below. May add a mapping for a certain arbitrary key='state' and value='@@STATE' to indicate a desire to obtain the entire state object and assign to a `state` property of Store.data. A change in any of the referenced properties results in this component render. When using '@@STATE', note that any change within the state object will result in this component render.
	 * @see {useStream} for selectorMap sample
	 */
	private _connect = <S extends SelectorMap>( selectorMap? : S ) => {
		const ctx = this;
		function connector<P extends ExtractInjectedProps<T, S>>(
			WrappedComponent : ElementType<ConnectProps<P, T, S>>
		) : ConnectedComponent<P>;
		function connector<P extends ExtractInjectedProps<T, S>>(
			WrappedComponent : NamedExoticComponent<ConnectProps<P, T, S>>
		) : ConnectedComponent<P>;
		function connector<P extends ExtractInjectedProps<T, S>>(
			WrappedComponent
		) : ConnectedComponent<P> {
			const useStream = ctx.useStream;
			const Wrapped = (
				!( isPlainObject( WrappedComponent ) && 'compare' in WrappedComponent as {} )
					? memo( WrappedComponent )
					: WrappedComponent
			);
			const ConnectedComponent = memo( forwardRef<
				P extends IProps ? P["ref"] : never,
				Omit<P, "ref">
			>(( ownProps, ref ) => {
				const store = useStream( selectorMap );
				return memoizeImmediateChildTree(
					<Wrapped { ...store } { ...ownProps } ref={ ref } />
				) as JSX.Element;
			}) );
			ConnectedComponent.displayName = 'ObservableContext.Connected';
			return ConnectedComponent as ConnectedComponent<P>;
		}
		return connector;
	}

	dispose(){ this.consumer.dispose() }
}

/* istanbul ignore next */
const ChildMemo : FC<{ child: ReactNode }> = (() => {

	/* istanbul ignore next */
	const useNodeMemo = ( node : ReactNode ) : ReactNode => {
		const nodeRef = useRef( node );
		if( !isEqual(
			omit( nodeRef.current, '_owner' ),
			omit( node, '_owner' )
		) ) { nodeRef.current = node }
		return nodeRef.current;
	};

	const ChildMemo = memo<{ child: ReactNode }>(({ child }) => ( <>{ child }</> ));
	ChildMemo.displayName = 'ObservableContext.Provider.Internal.Guardian.ChildMemo';

	const Guardian : FC<{ child: ReactNode }> = ({ child }) => (
		<ChildMemo child={ useNodeMemo( child ) } />
	);
	Guardian.displayName = 'ObservableContext.Provider.Internal.Guardian';

	return Guardian;
})();

/* istanbul ignore next */
function memoizeImmediateChildTree( children : ReactNode ) : ReactNode {
	return Children.map( children, _child => {
		let child = _child as JSX.Element;
		if( !( child?.type ) || ( // skip memoized or non element(s)
			typeof child.type === 'object' &&
			child.type.$$typeof?.toString() === 'Symbol(react.memo)'
		) ) {
			return child;
		}
		/* istanbul ignore if */
		if( child.props?.children ) {
			child = cloneElement(
				child,
				omit( child.props, 'children' ),
				memoizeImmediateChildTree( child.props.children )
			);
		}
		return ( <ChildMemo child={ child } /> );
	} );
}

export function createContext<T extends State>(
	value? : T,
	prehooks? : Prehooks<T>,
	storage? : IStorage<T>
) : ObservableContext<T>; 
export function createContext<T extends State>(
	value? : AutoImmutable<T>,
	prehooks? : Prehooks<T>,
	storage? : IStorage<T>
) : ObservableContext<T>;
export function createContext<T extends State>( value, prehooks, storage ) {
	return new ObservableContext<T>( value, prehooks, storage );
}
