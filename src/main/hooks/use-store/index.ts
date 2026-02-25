import type {
	PropertyInfo,
	Transform
} from '@webkrafters/data-distillery';

import type {
	Connection,
	Immutable,
	Listener as ConnectionListener,
	UpdatePayload
} from '@webkrafters/auto-immutable';

import type {
	Changes,
	IStorage,
	StoreInternal,
	Listener,
	PartialState,
	Prehooks,
	State
} from '../../..';

import {
	useCallback,
	useEffect,
	useRef,
	useState
} from 'react';

import isBoolean from 'lodash.isboolean';
import isEmpty from 'lodash.isempty';

import mapPathsToObject from '@webkrafters/data-distillery';
import stringToDotPath from '@webkrafters/path-dotize';
import getProperty from '@webkrafters/get-property';
import AutoImmutable from '@webkrafters/auto-immutable';

import {
	CLEAR_TAG,
	DELETE_TAG,
	FULL_STATE_SELECTOR,
	GLOBAL_SELECTOR,
	REPLACE_TAG
} from '../../../constants';

import Storage from '../../../model/storage';

import usePrehooksRef from '../use-prehooks-ref';

let iCount = -1;
const createStorageKey = () => `${ ++iCount }:${ Date.now() }:${ Math.random() }`;
// to facilitate testing
export const deps = { createStorageKey };

interface CurrentStorage<T extends State> extends IStorage<T> { isKeyRequired? : boolean }

function runPrehook <T extends State>( prehooks : Prehooks<T>, name : "resetState", args : [
	PartialState<T>, {
		current : T;
		original : T;
	}
] ) : boolean; 
function runPrehook <T extends State>( prehooks : Prehooks<T>, name : "setState", args : [ Changes<T>] ) : boolean; 
function runPrehook <T extends State>( prehooks, name, args ) : boolean {
	if( !( name in prehooks ) ) { return true }
	const res = prehooks[ name ]( ...args );
	if( !isBoolean( res ) ) {
		throw new TypeError( `\`${ name }\` prehook must return a boolean value.` );
	}
	return res;
}

const consumer : Record<string, {
	cache: Immutable,
	self: Connection<State>
}> = {};

function transformPayload<T extends State>( payload : UpdatePayload<T> ) {
	if( isEmpty( payload ) || !( FULL_STATE_SELECTOR in payload ) ) { return payload }
	payload = { ...payload, [ GLOBAL_SELECTOR ]: payload[ FULL_STATE_SELECTOR ] };
	delete payload[ FULL_STATE_SELECTOR ];
	return payload;
}

/** @param storage - is Closed to modification post-initialization */
const useStore = <T extends State>(
	prehooks : Prehooks<T>,
	value : PartialState<T>,
	storage? : CurrentStorage<T>
) => {

	const connKey = useRef<string>();

	const mounted = useRef( false );

	const prehooksRef = usePrehooksRef( prehooks );

	const storageKey = useRef<string>();

	const [[ cache, ownConnection ]] = useState<[
		AutoImmutable<Partial<T>>,
		Connection<T>
	]>(() => {
		if( connKey.current === undefined ) {
			const cache = new AutoImmutable( value );
			const self = cache.connect();
			connKey.current = self.instanceId;
			consumer[ connKey.current ] = { cache, self };
		}
		return [
			consumer[ connKey.current ].cache as Immutable<Partial<T>>,
			consumer[ connKey.current ].self as Connection<T>
		];
	});

	const [ listeners ] = useState<Set<Listener<State>>>(() => new Set());

	const [ _storage ] = useState<CurrentStorage<T>>(() => {
		let isKeyRequired = true;
		let _storage = storage;
		if( !storage ) {
			_storage = new Storage();
			isKeyRequired = _storage.isKeyRequired;
		}
		storageKey.current = isKeyRequired
			? deps.createStorageKey()
			: null
		return _storage;
	});

	const getChangHandler = useCallback<( changes : Changes<T> ) => ConnectionListener>(
		changes => ( netChanges, changedPathsTokens ) => {
			const mayHaveChangesAt = createChangePathSearch( changedPathsTokens );
			listeners.forEach( listener => listener( changes, changedPathsTokens, netChanges, mayHaveChangesAt ) );
		},
		[]
	);

	const resetState = useCallback<StoreInternal<T>["resetState"]>(
		( connection, propertyPaths = [] ) => {
			const original = _storage.clone( _storage.getItem( storageKey.current ) );
			let resetData = {};
			if( propertyPaths.includes( FULL_STATE_SELECTOR ) ) {
				resetData = isEmpty( original ) ? CLEAR_TAG : { [ REPLACE_TAG ]: original };
			} else {
				for( let path of propertyPaths ) {
					let node = resetData;
					const tokens = stringToDotPath( path ).split( '.' );
					const { trail, ...pInfo } = getProperty( original, tokens );
					for( let { length, ...keys } = trail, k = 0; k < length; k++ ) {
						if( REPLACE_TAG in node ) { continue }
						const key = keys[ k ];
						if( !( key in node ) ) { node[ key ] = {} }
						node = node[ key ];
					}
					if( REPLACE_TAG in node ) { continue }
					if( pInfo.exists ) {
						for( const k in node ) { delete node[ k ] }
						node[ REPLACE_TAG ] = pInfo._value;
						continue;
					}
					if( !( DELETE_TAG in node ) ) { node[ DELETE_TAG ] = [] }
					const deletingKey = tokens[ trail.length ];
					!node[ DELETE_TAG ].includes( deletingKey ) &&
					node[ DELETE_TAG ].push( deletingKey );
				}
			}
			runPrehook( prehooksRef.current, 'resetState', [
				resetData, {
					current: connection.get( GLOBAL_SELECTOR )[ GLOBAL_SELECTOR ],
					original
				}
			] ) && connection.set( resetData, getChangHandler( resetData ) );
		},
		[]
	);

	const setState = useCallback<StoreInternal<T>["setState"]>(
		( connection, changes ) => {
			if( !runPrehook( prehooksRef.current, 'setState', [ changes ] ) ) { return }
			if( !Array.isArray( changes ) ) {
				changes = transformPayload( changes );
			} else {
				changes = changes.slice();
				for( let c = changes.length; c--; ) {
					changes[ c ] = transformPayload( changes[ c ] );
				}
			}
			connection.set( changes, getChangHandler( changes ) );
		},
		[]
	);

	const subscribe = useCallback<StoreInternal<T>["subscribe"]>(
		listener => {
			listeners.add( listener );
			return () => listeners.delete( listener );
		},
		[]
	);

	useEffect(() => {
		const sKey = storageKey.current;
		_storage.setItem( sKey, _storage.clone( value as T ) );
		return () => {
			_storage.removeItem( sKey );
			ownConnection.disconnect();
			delete consumer[ connKey.current ];
			connKey.current = undefined;
			cache.close();
			listeners.clear();
		};
	}, []);

	useEffect(() => {
		if( !mounted.current ) {
			mounted.current = true;
			return;
		}
		setState( ownConnection, value as T );
	}, [ value ]);

	return useState<StoreInternal<T>>(
		() => ({ cache, resetState, setState, subscribe })
	)[ 0 ];
};

export default useStore;

/**
 * @param {Array<Array<string>>} changedPathsTokens - list containing tokenized changed object paths.
 * @returns {Function} - function verifying that a random tokenized object path falls within the changed paths domain.
 */
function createChangePathSearch({ length, ...pathTokenGroups } : Readonly<Array<Array<string>>> ){
	const root = {};
	for( let g = 0; g < length; g++ ) {
		for( let obj = root, tokens = pathTokenGroups[ g ], tLen = tokens.length, t = 0; t < tLen; t++ ) {
			const key = tokens[ t ];
			if( !( key in obj ) ) {
				obj[ key ] = {};
			}
			obj = obj[ key ];
		}
	}
	return ({ length, ...pathTokens }: Array<string> ) => {
		let obj = root;
		for( let p = 0; p < length; p++ ) {
			const key = pathTokens[ p ];
			if( key in obj ) {
				obj = obj[ key ];
				continue;
			}
			return !Object.keys( obj ).length;
		}
		return true;
	}
}
