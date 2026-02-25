import { Connection } from '@webkrafters/auto-immutable';

import Immutable from '@webkrafters/auto-immutable';

import { renderHook } from '@testing-library/react';

import { Prehooks } from '../../..';

import '../../../test-artifacts/suppress-render-compat';

import {
	CLEAR_TAG,
	DELETE_TAG,
	FULL_STATE_SELECTOR,
	GLOBAL_SELECTOR,
	REPLACE_TAG
} from '../../../constants';

import useStore, { deps } from '.';
import exp from 'constants';

const noop = () => {};

beforeAll(() => { jest.spyOn( deps, 'createStorageKey' ).mockReturnValue( expect.any( String ) ) });
afterAll( jest.restoreAllMocks );

describe( 'useStore', () => {
	let initialState;
	beforeAll(() => { initialState = { a: 1 } })
	describe( 'fundamentals', () => {
		test( 'creates a store', () => {
			const { result } = renderHook(
				({ prehooks: p, value: v }) => useStore( p, v ), {
					initialProps: {
						prehooks: {},
						value: initialState
					}
				}
			);
			expect( result.current ).toEqual( expect.objectContaining({
				cache: expect.any( Immutable ),
				resetState: expect.any( Function ),
				setState: expect.any( Function ),
				subscribe: expect.any( Function )
			}) );
		} );
		test( 'retains a clone of the initial state in storage', () => {
			const clone = jest.fn().mockReturnValue( initialState );
			const removeItem = noop;
			const setItem = jest.fn();
			renderHook(
				({ prehooks: p, value: v, storage: s }) => useStore( p, v, s ), {
					initialProps: {
						prehooks: {},
						value: initialState,
						storage: { clone, getItem:()=>{}, removeItem, setItem }
					}
				}
			);
			expect( clone ).toHaveBeenCalledTimes( 1 );
			expect( clone ).toHaveBeenCalledWith( initialState );
			expect( setItem ).toHaveBeenCalledTimes( 1 );
			expect( setItem.mock.calls[ 0 ][ 1 ] ).toStrictEqual( initialState );
		} );
		test( 'cleans up retained state from storage on store unmount if storage supported', () => {
			const clone = v => v;
			const setItem = noop;
			const removeItem = jest.fn();
			const { unmount } = renderHook(
				({ prehooks: p, value: v, storage: s }) => useStore( p, v, s ), {
					initialProps: {
						prehooks: {},
						value: initialState,
						storage: { clone, getItem: ()=>{}, removeItem, setItem }
					}
				}
			);
			expect( removeItem ).not.toHaveBeenCalled();
			unmount();
			expect( removeItem ).toHaveBeenCalledTimes( 1 );
		} );
		test( 'merges copies of subsequent value prop updates to state', async () => {
			const setStateSpy = jest.fn();
			const ConnectionMock = {
				disconnect: noop,
				set: setStateSpy
			} as unknown as Connection<{}>;
			const ImmutableConnectSpy = jest
				.spyOn( Immutable.prototype, 'connect' )
				.mockReturnValue( ConnectionMock );
			const { rerender } = renderHook(
				({ prehooks: p, value: v }) => useStore( p, v ), {
					initialProps: {
						prehooks: {},
						value: initialState
					}
				}
			);
			expect( setStateSpy ).not.toHaveBeenCalled();
			const updateState = { v: 3 };
			rerender({ prehooks: {}, value: updateState });
			expect( setStateSpy ).toHaveBeenCalledTimes( 1 );
			expect( setStateSpy.mock.calls[ 0 ][ 0 ] ).toBe( updateState );
			ImmutableConnectSpy.mockRestore();
		} );
	} );
	describe( 'store', () => {
		let storage;
		beforeAll(() => {
			storage = {
				clone: jest.fn().mockReturnValue( initialState ),
				getItem: jest.fn().mockReturnValue( initialState ),
				removeItem: jest.fn(),
				setItem: jest.fn()
			};
		});
		describe( 'normal flow', () => {
			let ConnectionMock, ImmutableConnectSpy, initialProps, prehooks, setAddSpy, setDeleteSpy, setStateSpy, store;
			beforeAll(() => {
				jest.clearAllMocks();
				setStateSpy = jest.fn();
				ConnectionMock = {
					disconnect: noop,
					get: expect.anything,
					set: setStateSpy
				};
				ImmutableConnectSpy = jest
					.spyOn( Immutable.prototype, 'connect' )
					.mockReturnValue( ConnectionMock );
				setAddSpy = jest.spyOn( Set.prototype, 'add' );
				setDeleteSpy = jest.spyOn( Set.prototype, 'delete' );
				prehooks = {
					resetState: jest.fn().mockReturnValue( true ),
					setState: jest.fn().mockReturnValue( true )
				};
				initialProps = { prehooks, value: initialState, storage };
				const { result } = renderHook(
					({ prehooks: p, storage: s, value: v }) => useStore( p, v, s ),
					{ initialProps }
				);
				store = result.current;
			});
			afterAll(() => {
				setAddSpy.mockRestore();
				setDeleteSpy.mockRestore();
				ImmutableConnectSpy.mockRestore();
			});
			describe( 'resetState', () => {
				beforeAll(() => {
					prehooks.resetState.mockClear();
					setStateSpy.mockClear();
					storage.getItem.mockClear();
					store.resetState( ConnectionMock );
				});
				test( 'obtains initial state from storage', () => {
					expect( storage.getItem ).toHaveBeenCalled();
				} );
				test( 'runs the avaiable prehook', () => {
					expect( prehooks.resetState ).toHaveBeenCalled();
				} );
				test( 'resets the state if prehook evaluates to true', () => {
					// prehook.resetState had been mocked to return true
					// please see 'prehooks effects' describe block for alternate scenario
					expect( setStateSpy ).toHaveBeenCalled();
				} );
				describe( 'with no arguments', () => {
					test( 'runs the available prehook with an empty update data', () => {
						expect( prehooks.resetState.mock.calls[ 0 ][ 0 ] ).toEqual({});
					} );
					test( 'attempts to update current state with an empty update data', () => {
						expect( setStateSpy.mock.calls[ 0 ][ 0 ] ).toEqual({});
					} );
				} );
				describe( 'with arguments', () => {
					let stateKey0, resetData;
					beforeAll(() => {
						prehooks.resetState.mockClear();
						setStateSpy.mockClear();
						stateKey0 = Object.keys( initialState )[ 0 ];
						resetData = { [ stateKey0 ]: { [ REPLACE_TAG ]: initialState[ stateKey0 ] } };
						store.resetState( ConnectionMock, [ stateKey0 ]);
					} );
					test( 'runs the available prehook with update data corresponding to resetState argument', () => {
						expect( prehooks.resetState.mock.calls[ 0 ][ 0 ] ).toEqual( resetData );
					} );
					test( 'merges the update data into current state', () => {
						expect( setStateSpy.mock.calls[ 0 ][ 0 ] ).toEqual( resetData );
					} );
					describe( 'containing the `' + FULL_STATE_SELECTOR + '` path', () => {
						let initialState, storageCloneMockImpl, storageGetItemMockImpl;
						beforeAll(() => {
							storageCloneMockImpl = storage.clone.getMockImplementation();
							storageGetItemMockImpl = storage.getItem.getMockImplementation();
							prehooks.resetState.mockClear();
							setStateSpy.mockClear();
							initialState = { ...initialState, b: { z: expect.anything() } };
							storage.clone.mockReset().mockReturnValue( initialState );
							storage.getItem.mockReset().mockReturnValue( initialState );
							const { result } = renderHook(
								({ prehooks: p, storage: s, value: v }) => useStore( p, v, s ),
								{ initialProps: { prehooks, storage, value: initialState } }
							);
							const store = result.current;
							store.resetState( ConnectionMock, [ 'a', FULL_STATE_SELECTOR, 'b.z' ]);
						});
						afterAll(() => {
							storage.clone.mockReset().mockImplementation( storageCloneMockImpl );
							storage.getItem.mockReset().mockImplementation( storageGetItemMockImpl );
						});
						test( 'runs the available prehook with update data equaling the initial state', () => {
							expect( prehooks.resetState.mock.calls[ 0 ][ 0 ] )
								.toEqual({ [ REPLACE_TAG ]: initialState });
						} );
						test( 'merges the initial state into current state', () => {
							expect( setStateSpy.mock.calls[ 0 ][ 0 ] )
								.toEqual({ [ REPLACE_TAG ]: initialState });
						} );
					} );
				} );
				describe( 'path arguments not occurring in intial state', () => {
					let nonInitStatePaths, resetData;
					beforeAll(() => {
						prehooks.resetState.mockClear();
						setStateSpy.mockClear();
						nonInitStatePaths = [
							'a',
							'dsdfd.adfsdff',
							'dsdfd.sfgrwfg'
						];
						resetData = {
							a: {
								[ REPLACE_TAG ]: initialState.a
							},
							[ DELETE_TAG ]: [ 'dsdfd' ]
						};
						store.resetState( ConnectionMock, nonInitStatePaths );
					});
					test( 'are deleted from current state', () => {
						expect( setStateSpy.mock.calls[ 0 ][ 0 ] ).toEqual( resetData );
					} );
				} );
				describe( 'with paths containing the `' + FULL_STATE_SELECTOR + '` path where initial state is empty', () => {
					let storageCloneMockImpl, storageGetItemMockImpl;
					beforeAll(() => {
						storageCloneMockImpl = storage.clone.getMockImplementation();
						storageGetItemMockImpl = storage.getItem.getMockImplementation();
						prehooks.resetState.mockClear();
						setStateSpy.mockClear();
						storage.clone.mockReset().mockReturnValue();
						storage.getItem.mockReset().mockReturnValue();
						const { result } = renderHook(
							({ prehooks: p, storage: s }) => useStore( p, undefined, s ),
							{ initialProps: { prehooks, storage } }
						);
						const store = result.current;
						store.resetState( ConnectionMock, [ 'a', FULL_STATE_SELECTOR, 'b.z' ]);
					});
					afterAll(() => {
						storage.clone.mockReset().mockImplementation( storageCloneMockImpl );
						storage.getItem.mockReset().mockImplementation( storageGetItemMockImpl );
					});
					test( 'empties the current state', () => {
						expect( setStateSpy.mock.calls[ 0 ][ 0 ] ).toEqual( CLEAR_TAG );
					} );
				} );
			} );
			describe( 'setState', () => {
				describe( 'normal operations', () => {
					beforeAll(() => {
						prehooks.setState.mockClear();
						setStateSpy.mockClear();
						store.setState( ConnectionMock );
					});
					test( 'runs the avaiable prehook', () => {
						expect( prehooks.setState ).toHaveBeenCalled();
					} );
					test( 'sets the state if prehook evaluates to true', () => {
						// prehook.setState had been mocked to return true
						// please see 'prehooks effects' describe block for alternate scenario
						expect( setStateSpy ).toHaveBeenCalled();
					} );
				} );
				describe( 'payload', () => {
					beforeEach(() => { setStateSpy.mockClear() });
					test( 'can be a single change object', () => {
						const payload = { a: expect.anything() };
						store.setState( ConnectionMock, payload );
						expect( setStateSpy.mock.calls[ 0 ][ 0 ] ).toEqual( payload );
					
					} );
					test( 'can be an array of change objects', () => {
						const payload = [
							{ a: expect.anything() },
							{ x: expect.anything() }
						];
						store.setState( ConnectionMock, payload );
						expect( setStateSpy.mock.calls[ 0 ][ 0 ] ).toEqual( payload );
					} );
				});
				describe( 'payload translation for compatibility with the cache', () => {
					beforeEach(() => { setStateSpy.mockClear() })
					test( 'returns empty payload as-is', () => {
						store.setState( ConnectionMock );
						expect( setStateSpy.mock.calls[ 0 ][ 0 ] ).toEqual( undefined );
						setStateSpy.mockClear();
						store.setState( ConnectionMock, null );
						expect( setStateSpy.mock.calls[ 0 ][ 0 ] ).toEqual( null );
					} );
					test( 'returns non top-level ' + FULL_STATE_SELECTOR + ' key bearing payload as-is', () => {
						const payload = {
							a: expect.anything(),
							b: {
								[ FULL_STATE_SELECTOR ]: expect.anything()
							}
						};
						store.setState( ConnectionMock, payload );
						expect( setStateSpy.mock.calls[ 0 ][ 0 ] ).toEqual( payload );
					} );
					test( 'converts all top-level' + FULL_STATE_SELECTOR + ' payload keys only', () => {
						const asIsPayload = {
							a: expect.anything(),
							q: {
								[ FULL_STATE_SELECTOR ]: expect.anything()
							}
						};
						store.setState( ConnectionMock, {
							[ FULL_STATE_SELECTOR ]: expect.anything(),
							...asIsPayload
						});
						expect( setStateSpy.mock.calls[ 0 ][ 0 ] ).toEqual({
							[ GLOBAL_SELECTOR ]: expect.anything(),
							...asIsPayload
						});
					} );
					test( 'converts any payload bearing top-level ' + FULL_STATE_SELECTOR + ' keys amongst a payload list', () => {
						store.setState( ConnectionMock, [{
							[ FULL_STATE_SELECTOR ]: expect.anything(),
							a: expect.anything()
						}, {
							a: expect.anything()
						}, {
							z: expect.anything(),
							k: expect.anything(),
							[ FULL_STATE_SELECTOR ]: expect.anything(),
							a: expect.anything()
						}, {
							s: expect.anything(),
							t: {
								[ FULL_STATE_SELECTOR ]: expect.anything()
							}
						}, {
							l: [ [ FULL_STATE_SELECTOR ] ],
							p: expect.anything()
						}] );
						expect( setStateSpy.mock.calls[ 0 ][ 0 ] ).toEqual([{
							[ GLOBAL_SELECTOR ]: expect.anything(),
							a: expect.anything()
						}, {
							a: expect.anything()
						}, {
							z: expect.anything(),
							k: expect.anything(),
							[ GLOBAL_SELECTOR ]: expect.anything(),
							a: expect.anything()
						}, {
							s: expect.anything(),
							t: {
								[ FULL_STATE_SELECTOR ]: expect.anything()
							}
						}, {
							l: [[ FULL_STATE_SELECTOR ]],
							p: expect.anything()
						}]);
					} );
				} );
			} );
			describe( 'subscribe', () => {
				const LISTENER = 'LISTENER STUB';
				let result;
				beforeAll(() => {
					setAddSpy.mockClear();
					setDeleteSpy.mockClear();
					result = store.subscribe( LISTENER );
				});
				test( 'adds a new subscriber', () => {
					expect( setAddSpy ).toHaveBeenCalled();
					expect( setAddSpy ).toHaveBeenCalledWith( LISTENER );
				} );
				test( 'returns a function to unsub the new subscriber', () => {
					expect( result ).toBeInstanceOf( Function );
					expect( setDeleteSpy ).not.toHaveBeenCalled();
					result();
					expect( setDeleteSpy ).toHaveBeenCalledWith( LISTENER );
				} );
			} );
		} );
		describe( 'prehooks effects', () => {
			let ConnectionMock, ImmutableConnectSpy, setStateSpy, store;
			beforeAll(() => {
				jest.clearAllMocks();
				setStateSpy = jest.fn();
				ConnectionMock = {
					disconnect: noop,
					get: expect.anything,
					set: setStateSpy
				};
				ImmutableConnectSpy = jest
					.spyOn( Immutable.prototype, 'connect' )
					.mockReturnValue( ConnectionMock );
				store = renderHook(
					({ prehooks: p, storage: s, value: v }) => useStore( p, v, s ),
					{
						initialProps: {
							prehooks: {
								resetState: jest.fn().mockReturnValue( false ),
								setState: jest.fn().mockReturnValue( false )
							},
							storage,
							value: initialState
						}
					}
				).result.current;
			});
			afterAll(() => { ImmutableConnectSpy.mockRestore() });
			describe( 'resetState #2', () => {
				test( 'will not reset the state if prehook evaluates to false', () => {
					// prehooks.resetState had been mocked to return false
					store.resetState( ConnectionMock );
					expect( setStateSpy ).not.toHaveBeenCalled();
				} );
				test( 'throws if return type is not boolean', () => {
					const { result } = renderHook(
						({ prehooks: p, storage: s, value: v }) => useStore( p, v, s ),
						{
							initialProps: {
								prehooks: {
									resetState: noop,
									setState: () => true
								} as unknown as Prehooks<any>,
								storage,
								value: initialState
							}
						}
					);
					expect(() => result.current.resetState( ConnectionMock ))
						.toThrow( '`resetState` prehook must return a boolean value.' );
				} );
			} );
			describe( 'setState #2', () => {
				test( 'will not set the state if prehook evaluates to false', () => {
					// prehooks.setState had been mocked to return false
					store.setState();
					expect( setStateSpy ).not.toHaveBeenCalled();
				} );
				test( 'throws if return type is not boolean', () => {
					const { result } = renderHook(
						({ prehooks: p, storage: s, value: v }) => useStore( p, v, s ),
						{
							initialProps: {
								prehooks: {
									resetState: () => true,
									setState: noop
								} as unknown as Prehooks<any>,
								storage,
								value: initialState
							}
						}
					);
					expect(() => result.current.setState( ConnectionMock, expect.anything() ))
						.toThrow( '`setState` prehook must return a boolean value.' );
				} );
			} );
		} );
	} );
} );
