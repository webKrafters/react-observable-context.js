import { AccessorResponse } from '@webkrafters/auto-immutable';

import {
	FULL_STATE_SELECTOR,
	IStorage,
	Prehooks,
	type ConnectedComponent,
	type ConnectProps,
	type ExtractInjectedProps,
	type SelectorMap,
	type Store
} from '..';

import getProperty from '@webkrafters/get-property';

import React, { useCallback } from 'react';

import {
	cleanup as cleanupPerfTest,
	type DefaultPerfToolsField,
	perf,
	RenderCountField,
	type PerfTools,
	wait
} from 'react-performance-testing';

import {
	cleanup,
	fireEvent,
	render,
	screen,
	SelectorMatcherOptions
} from '@testing-library/react';

import '@testing-library/jest-dom';

import * as AutoImmutableModule from '@webkrafters/auto-immutable';

import clonedeep from '@webkrafters/clone-total';

import {
	createContext,
	ObservableContext as ObservableContextType
} from '.';

import { isReadonly } from '../test-artifacts/utils';

import createSourceData, {
	type SourceData
} from '../test-artifacts/data/create-state-obj';

import {
	defaultState,
	createNormalClient,
	TestState
} from './test-apps/normal';
import { createConnectedClient } from './test-apps/with-connected-children';
import { createPureClient } from './test-apps/with-pure-children';

type PerfValue = PerfTools<DefaultPerfToolsField>;

beforeAll(() => {
	jest.spyOn( console, 'log' ).mockImplementation(() => {});
	jest.spyOn( console, 'error' ).mockImplementation(() => {});
});
afterAll(() => jest.resetAllMocks());
afterEach( cleanup );

const transformRenderCount = (
	renderCount : PerfValue["renderCount"],
	baseRenderCount : Record<string,any> = {}
) => {
	const netCount : typeof baseRenderCount = {};
	for( const k of new Set([
		...Object.keys( renderCount.current ),
		...Object.keys( baseRenderCount )
	]) ) {
		// @ts-expect-error
		netCount[ k ] = ( renderCount.current[ k ]?.value || 0 ) - ( baseRenderCount[ k ] || 0 );
	}
	return netCount;
};

describe( 'ReactObservableContext', () => {
	describe( 'Provider-less', () => {
		describe( 'applicable anywhere external of and within the application', () => {
			describe( 'using connected store subscribers', () => {
				let ObservableContext : ObservableContextType<Partial<TestState>>;
				let AppWithConnectedChildren : React.FC;
				beforeEach(() => {
					ObservableContext = createContext( defaultState as Partial<TestState> );
					const client = createConnectedClient( ObservableContext );
					AppWithConnectedChildren = client.App;
				});
				afterAll(() => { ObservableContext.dispose() });
				test( 'scenario 1', async () => {
					const { renderCount } : PerfValue = perf( React );
					render( <AppWithConnectedChildren /> );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Price:' ), { target: { value: '123' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update price' } ) );
					await wait(() => {
						expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
							App: 0,
							CapitalizedDisplay: 0,
							CustomerPhoneDisplay: 0,
							Editor: 0,
							'ObservableContext.Connected': 0,
							PriceSticker: 1,
							Product: 0,
							ProductDescription: 0,
							Reset: 0,
							TallyDisplay: 1
						});
					});
					cleanupPerfTest();
				} );
				test( 'scenario 2', async () => {
					const { renderCount } : PerfValue = perf( React );
					render( <AppWithConnectedChildren /> );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Color:' ), { target: { value: 'Navy' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update color' } ) );
					await wait(() => {
						expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
							App: 0,
							CapitalizedDisplay: 0,
							CustomerPhoneDisplay: 0,
							Editor: 0,
							'ObservableContext.Connected': 0,
							PriceSticker: 0,
							Product: 0,
							ProductDescription: 1,
							Reset: 0,
							TallyDisplay: 1
						});
					});
					cleanupPerfTest();
				} );
				test( 'scenario 3', async () => {
					const { renderCount } : PerfValue = perf( React );
					render( <AppWithConnectedChildren /> );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
							App: 0,
							CapitalizedDisplay: 0,
							CustomerPhoneDisplay: 0,
							Editor: 0,
							'ObservableContext.Connected': 0,
							PriceSticker: 0,
							Product: 0,
							ProductDescription: 1,
							Reset: 0,
							TallyDisplay: 1
						});
					});
					cleanupPerfTest();
				} );
				test( 'does not render subscribed components for resubmitted changes', async () => {
					const { renderCount } : PerfValue = perf( React );
					render( <AppWithConnectedChildren /> );
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
							App: 0,
							CapitalizedDisplay: 0,
							CustomerPhoneDisplay: 0,
							Editor: 0,
							'ObservableContext.Connected': 0,
							PriceSticker: 0,
							Product: 0,
							ProductDescription: 0,
							Reset: 0,
							TallyDisplay: 0
						});
					});
					cleanupPerfTest();
				} );
			} );
	 		describe( 'using pure-component store subscribers', () => {
				let ObservableContext : ObservableContextType<Partial<TestState>>;
				let AppWithPureChildren : React.FC;
				beforeEach(() => {
					ObservableContext = createContext( defaultState as Partial<TestState> );
					const client = createPureClient( ObservableContext );
					AppWithPureChildren = client.App;
				});
				afterAll(() => { ObservableContext.dispose() });
				test( 'scenario 1', async () => {
					const { renderCount } : PerfValue = perf( React );
					render( <AppWithPureChildren /> );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Price:' ), { target: { value: '123' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update price' } ) );
					await wait(() => {
						expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
							App: 0,
							CapitalizedDisplay: 0,
							CustomerPhoneDisplay: 0,
							Editor: 0,
							PriceSticker: 1,
							Product: 0,
							ProductDescription: 0,
							Reset: 0,
							TallyDisplay: 1
						});
					});
					cleanupPerfTest();
				} );
				test( 'scenario 2', async () => {
					const { renderCount } : PerfValue = perf( React );
					render( <AppWithPureChildren /> );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Color:' ), { target: { value: 'Navy' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update color' } ) );
					await wait(() => {
						expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
							App: 0,
							CapitalizedDisplay: 0,
							CustomerPhoneDisplay: 0,
							Editor: 0,
							PriceSticker: 0,
							Product: 0,
							ProductDescription: 1,
							Reset: 0,
							TallyDisplay: 1
						});
					});
					cleanupPerfTest();
				} );
				test( 'scenario 3', async () => {
					const { renderCount } : PerfValue = perf( React );
					render( <AppWithPureChildren /> );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
							App: 0,
							CapitalizedDisplay: 0,
							CustomerPhoneDisplay: 0,
							Editor: 0,
							PriceSticker: 0,
							Product: 0,
							ProductDescription: 1,
							Reset: 0,
							TallyDisplay: 1
						});
					});
					cleanupPerfTest();
				} );
				test( 'does not render subscribed components for resubmitted changes', async () => {
					const { renderCount } : PerfValue = perf( React );
					render( <AppWithPureChildren /> );
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
							App: 0,
							CapitalizedDisplay: 0,
							CustomerPhoneDisplay: 0,
							Editor: 0,
							PriceSticker: 0,
							Product: 0,
							ProductDescription: 0,
							Reset: 0,
							TallyDisplay: 0
						});
					});
					cleanupPerfTest();
				} );
			} );
			describe( 'using non pure-component store subscribers', () => {
				let ObservableContext : ObservableContextType<Partial<TestState>>;
				let AppNormal : React.FC;
				beforeEach(() => {
					ObservableContext = createContext( defaultState as Partial<TestState> );
					const client = createNormalClient( ObservableContext );
					AppNormal = client.App;
				});
				afterAll(() => { ObservableContext.dispose() });
				test( 'scenario 1', async () => {
					const { renderCount } : PerfValue = perf( React );
					render( <AppNormal /> );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Price:' ), { target: { value: '123' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update price' } ) );
					await wait(() => {
						expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
							App: 0,
							CapitalizedDisplay: 0,
							CustomerPhoneDisplay: 1,
							Editor: 0,
							PriceSticker: 1,
							Product: 0,
							ProductDescription: 0,
							Reset: 1,
							TallyDisplay: 1
						});
					});
					cleanupPerfTest();
				} );
				test( 'scenario 2', async () => {
					const { renderCount } : PerfValue = perf( React );
					render( <AppNormal /> );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Color:' ), { target: { value: 'Navy' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update color' } ) );
					await wait(() => {
						expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
							App: 0,
							CapitalizedDisplay: 0,
							CustomerPhoneDisplay: 1,
							Editor: 0,
							PriceSticker: 0,
							Product: 0,
							ProductDescription: 1,
							Reset: 1,
							TallyDisplay: 1
						});
					});
					cleanupPerfTest();
				} );
				test( 'scenario 3', async () => {
					const { renderCount } : PerfValue = perf( React );
					render( <AppNormal /> );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
							App: 0,
							CapitalizedDisplay: 0,
							CustomerPhoneDisplay: 1,
							Editor: 0,
							PriceSticker: 0,
							Product: 0,
							ProductDescription: 1,
							Reset: 1,
							TallyDisplay: 1
						});
					});
					cleanupPerfTest();
				} );
				test( 'does not render resubmitted changes', async () => {
					const { renderCount } : PerfValue = perf( React );
					render( <AppNormal /> );
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
							App: 0,
							CapitalizedDisplay: 0,
							CustomerPhoneDisplay: 0,
							Editor: 0,
							PriceSticker: 0,
							Product: 0,
							ProductDescription: 0,
							Reset: 0,
							TallyDisplay: 0
						});
					});
					cleanupPerfTest();
				} );
			} );
		} );
	} );
	describe( 'store updates from outside the Provider tree', () => {
		describe( 'with connected component children', () => {let ObservableContext : ObservableContextType<Partial<TestState>>;
			let AppWithConnectedChildren : React.FC;
			beforeEach(() => {
				ObservableContext = createContext( defaultState as Partial<TestState> );
				const client = createConnectedClient( ObservableContext );
				AppWithConnectedChildren = client.App;
			});
			afterAll(() => { ObservableContext.dispose() });
			test( 'only re-renders Provider children affected by the Provider parent prop change', async () => {
				const { renderCount } : PerfValue = perf( React );
				render( <AppWithConnectedChildren /> );
				let baseRenderCount : Record<string,any>;
				await wait(() => { baseRenderCount = transformRenderCount( renderCount ); });
				fireEvent.keyUp( screen.getByLabelText( 'Type:' ), { target: { value: 'A' } } );
				await wait(() => {
					expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
						App: 1,
						CapitalizedDisplay: 0,
						CustomerPhoneDisplay: 0,
						Editor: 0,
						'ObservableContext.Connected': 0,
						PriceSticker: 0,
						Product: 1,
						ProductDescription: 1,
						Reset: 0,
						TallyDisplay: 1
					});
				});
				cleanupPerfTest();
			} );
			test( 'only re-renders parts of the Provider tree directly affected by the Provider parent state update', async () => {
				const { renderCount } : PerfValue = perf( React );
				render( <AppWithConnectedChildren /> );
				let baseRenderCount : Record<string,any>;
				await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
				fireEvent.keyUp( screen.getByLabelText( '$', {
					key: '5',
					code: 'Key5'
				} as SelectorMatcherOptions ) );
				await wait(() => {
					expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({				
						App: 0,
						CapitalizedDisplay: 0,
						CustomerPhoneDisplay: 0,
						Editor: 0,
						'ObservableContext.Connected': 0,
						PriceSticker: 1,
						Product: 0,
						ProductDescription: 0,
						Reset: 0,
						TallyDisplay: 1
					});
				});
				cleanupPerfTest();
			} );
	 	} );
		describe( 'with pure-component children', () => {
			let ObservableContext : ObservableContextType<Partial<TestState>>;
			let AppWithPureChildren : React.FC;
			beforeEach(() => {
				ObservableContext = createContext( defaultState as Partial<TestState> );
				const client = createPureClient( ObservableContext );
				AppWithPureChildren = client.App;
			});
			afterAll(() => { ObservableContext.dispose() });
			test( 'only re-renders Provider children affected by the Provider parent prop change', async () => {
				const { renderCount } : PerfValue = perf( React );
				render( <AppWithPureChildren /> );
				let baseRenderCount : Record<string,any>;
				await wait(() => { baseRenderCount = transformRenderCount( renderCount ); });
				fireEvent.keyUp( screen.getByLabelText( 'Type:' ), { target: { value: 'A' } } );
				await wait(() => {
					expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
						App: 1,
						CapitalizedDisplay: 0,
						CustomerPhoneDisplay: 0,
						Editor: 0,
						PriceSticker: 0,
						Product: 1,
						ProductDescription: 1,
						Reset: 0,
						TallyDisplay: 1
					});
				});
				cleanupPerfTest();
			} );
			test( 'only re-renders parts of the Provider tree directly affected by the Provider parent state update', async () => {
				const { renderCount } : PerfValue = perf( React );
				render( <AppWithPureChildren /> );
				let baseRenderCount : Record<string,any>;
				await wait(() => { baseRenderCount = transformRenderCount( renderCount ); });
				fireEvent.keyUp( screen.getByLabelText( '$', { key: '5', code: 'Key5' } as SelectorMatcherOptions ) );
				await wait(() => {
					expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
						App: 0,
						CapitalizedDisplay: 0,
						CustomerPhoneDisplay: 0,
						Editor: 0,
						PriceSticker: 1,
						Product: 0,
						ProductDescription: 0,
						Reset: 0,
						TallyDisplay: 1
					});
				});
				cleanupPerfTest();
			} );
		} );
		describe( 'with non pure-component children ', () => {
			let ObservableContext : ObservableContextType<Partial<TestState>>;
			let AppNormal : React.FC;
			beforeEach(() => {
				ObservableContext = createContext( defaultState as Partial<TestState> );
				const client = createNormalClient( ObservableContext );
				AppNormal = client.App;
			});
			afterAll(() => { ObservableContext.dispose() });
			test( 'only re-renders Provider children affected by the Provider parent prop change', async () => {
				const { renderCount } : PerfValue = perf( React );
				render( <AppNormal /> );
				let baseRenderCount : Record<string,any>;
				await wait(() => { baseRenderCount = transformRenderCount( renderCount ); });
				fireEvent.keyUp( screen.getByLabelText( 'Type:' ), { target: { value: 'A' } } );
				await wait(() => {
					expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
						App: 1,
						Product: 1,
						Editor: 1,
						TallyDisplay: 2,
						CustomerPhoneDisplay: 2,
						CapitalizedDisplay: 0,
						Reset: 2,
						ProductDescription: 2,
						PriceSticker: 1
					});
				});
				cleanupPerfTest();
			} );
			test( 'only re-renders parts of the Provider tree directly affected by the Provider parent state update', async () => {
				const { renderCount } : PerfValue = perf( React );
				render( <AppNormal /> );
				let baseRenderCount : Record<string,any>;
				await wait(() => { baseRenderCount = transformRenderCount( renderCount ); });
				fireEvent.keyUp( screen.getByLabelText( '$', { key: '5', code: 'Key5' } as SelectorMatcherOptions ) );
				await wait(() => {
					expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
						App: 0,
						CapitalizedDisplay: 0,
						CustomerPhoneDisplay: 1,
						Editor: 0,
						PriceSticker: 1,
						Product: 0,
						ProductDescription: 0,
						Reset: 1,
						TallyDisplay: 1
					});
				});
				cleanupPerfTest();
			} );
		} );
	} );
	describe( 'manipulating components externally through context store reference', () => {
		let TestObservableCtx : ObservableContextType<Partial<SourceData>>;
		let sourceData : Partial<SourceData>
		let Client : React.FC;
		beforeAll(() => { sourceData = createSourceData() });
		beforeEach(() => {
			TestObservableCtx = createContext( sourceData );
			Client = TestObservableCtx
				.connect({
					employer: 'company',
					isActive: 'isActive',
					tag6: 'tags[5]'
				})(({ data, setState }) => {
					const changeFirstName = useCallback(() => setState({
						name: {
							first: 'Hallelujah'
						}
					}), []);
					return (
						<>
							<div data-testid="data-output">
								{ JSON.stringify( data ) }
							</div>
							<button onClick={ changeFirstName } />
						</>
					);
				});
		});
		afterEach(() => { TestObservableCtx.dispose() })
		test( 'is successful', async () => {
			render( <Client /> );
			await wait(() => {});
			expect( screen.getByTestId( 'data-output' ).textContent ).toEqual(
				JSON.stringify({
					employer: 'VORTEXACO',
					isActive: false,
					tag6: 'laborum'
				})
			);
			// externally update UI states
			TestObservableCtx.store.setState({
				company: 'NEW CORPORATE INC',
				isActive: true,
				tags: { 5: 'MY SIXTH REMOTE' }
			} as unknown as Partial<SourceData> );
			await wait(() => {});
			expect( screen.getByTestId( 'data-output' ).textContent ).toEqual(
				JSON.stringify({
					employer: 'NEW CORPORATE INC',
					isActive: true,
					tag6: 'MY SIXTH REMOTE'
				})
			);

			// externally reset any specific UI slice of the state
			TestObservableCtx.store.resetState([ 'isActive' ]);
			await wait(() => {});
			expect( screen.getByTestId( 'data-output' ).textContent ).toEqual(
				JSON.stringify({
					employer: 'NEW CORPORATE INC',
					isActive: false,
					tag6: 'MY SIXTH REMOTE'
				})
			);

			// externally read specific slices of the state
			expect( TestObservableCtx.store.getState(
				[ 'company', 'isActive', 'tags[5]' ]
			) ).toEqual({
				company: 'NEW CORPORATE INC',
				isActive: false,
				tags: [ , , , , , 'MY SIXTH REMOTE' ]
			});

			// externally observe updates made to specific slices of the state
			const onUpdate = jest.fn();
			const unsub = TestObservableCtx.store.subscribe( 'data-updated', onUpdate );
			expect( onUpdate ).not.toHaveBeenCalled();
			expect( TestObservableCtx.store.getState([ 'name.first' ]) )
				.toEqual({ name: { first: 'Amber' } });
			fireEvent.click( screen.getByRole( 'button' ) );
			await wait(() => {});
			expect( TestObservableCtx.store.getState([ 'name.first' ]) )
				.toEqual({ name: { first: 'Hallelujah' } });
			expect( onUpdate ).toHaveBeenCalledTimes( 1 );
			expect( onUpdate.mock.calls[ 0 ][ 0 ] ).toEqual({ name: { first: 'Hallelujah' } });
			expect( onUpdate.mock.calls[ 0 ][ 1 ] ).toEqual([[ 'name', 'first' ]]);
			expect( onUpdate.mock.calls[ 0 ][ 2 ] ).toEqual({ name: { first: 'Hallelujah' } });
			expect( onUpdate.mock.calls[ 0 ][ 3 ] ).toEqual( expect.any( Function ));
			unsub();

			// externally receive the entire state
			expect( TestObservableCtx.store.getState() ).toEqual({
				...sourceData,
				company: 'NEW CORPORATE INC',
				name: {
					...sourceData.name,
					first: 'Hallelujah'
				},
				tags: (() => {
					const tags = [ ...sourceData.tags! ];
					tags[ 5 ] = 'MY SIXTH REMOTE';
					return tags;
				})() 
			});

			// externally reset the entire state
			TestObservableCtx.store.resetState([ FULL_STATE_SELECTOR ]);
			expect( TestObservableCtx.store.getState() ).toStrictEqual( sourceData );
		});
		test( 'will reset state whenever ' + FULL_STATE_SELECTOR + ' appears in the list of target reset paths', async () => {
			
			render( <Client /> );
			await wait(() => {});
			expect( screen.getByTestId( 'data-output' ).textContent ).toEqual(
				JSON.stringify({
					employer: 'VORTEXACO',
					isActive: false,
					tag6: 'laborum'
				})
			);
			// externally update UI states
			TestObservableCtx.store.setState({
				company: 'NEW CORPORATE INC',
				isActive: true,
				tags: { 5: 'MY SIXTH REMOTE' }
			} as unknown as Partial<SourceData> );
			await wait(() => {});
			expect( screen.getByTestId( 'data-output' ).textContent ).toEqual(
				JSON.stringify({
					employer: 'NEW CORPORATE INC',
					isActive: true,
					tag6: 'MY SIXTH REMOTE'
				})
			);

			// externally reset any specific UI slice of the state
			TestObservableCtx.store.resetState([ 'isActive', FULL_STATE_SELECTOR ]);
			await wait(() => {});
			expect( screen.getByTestId( 'data-output' ).textContent ).toEqual(
				JSON.stringify({
					employer: 'VORTEXACO',
					isActive: false,
					tag6: 'laborum'
				})
			);
			expect( TestObservableCtx.store.getState() ).toEqual( sourceData );
		})
	} );
	describe( 'prehooks', () => {
		let ObservableContext : ObservableContextType<Partial<TestState>>;
		let Product : React.FC<{
			prehooks? : Prehooks;
			type : string;
		}>;
		beforeEach(() => {
			ObservableContext = createContext( defaultState as Partial<TestState> );
			const client = createNormalClient( ObservableContext );
			Product = client.Product;
		});
		afterAll(() => { ObservableContext.dispose() });
		describe( 'resetState prehook', () => {
			describe( 'when `resetState` prehook does not exist on the context', () => {
				test( 'completes `store.resetState` method call', async () => {
					const { renderCount } : PerfValue = perf( React );
					const prehooks = {};
					render( <Product prehooks={ prehooks } type="Computer" /> );
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					let baseRenderCount : Record<string,any> = {};
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.click( screen.getByRole( 'button', { name: 'reset context' } ) );
					await wait(() => {
						expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
							CapitalizedDisplay: 0,
							CustomerPhoneDisplay: 1,
							Editor: 0,
							PriceSticker: 0,
							Product: 0,
							ProductDescription: 1,
							Reset: 1,
							TallyDisplay: 1
						});
					});
					cleanupPerfTest();
				} );
			} );
			describe( 'when `resetState` prehook exists on the context', () => {
				test( 'is called by the `store.resetState` method', async () => {
					const prehooks = Object.freeze({ resetState: jest.fn().mockReturnValue( false ) });
					render( <Product prehooks={ prehooks } type="Computer" /> );
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					fireEvent.change( screen.getByLabelText( 'New Color:' ), { target: { value: 'Teal' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update color' } ) );
					prehooks.resetState.mockClear();
					fireEvent.click( screen.getByRole( 'button', { name: 'reset context' } ) );
					expect( prehooks.resetState ).toHaveBeenCalledTimes( 1 );
					expect( prehooks.resetState.mock.calls[ 0 ][ 0 ]).toEqual({
						[ AutoImmutableModule.REPLACE_TAG ]: {
							// data slices from original state to reset current state slices
							color: 'Burgundy',
							customer: {
								name: { first: null, last: null },
								phone: null
							},
							price: 22.5,
							type: ''
						}
					});
					expect( prehooks.resetState.mock.calls[ 0 ][ 1 ]).toEqual({
						// current: context state value after the `update type` & `update color` button clicks
						current: {
							color: 'Teal',
							customer: {
								name: { first: null, last: null },
								phone: null
							},
							price: 22.5,
							type: 'Bag'
						},
						// original: obtained from the './normal' Product >> Provider value prop
						original: {
							color: 'Burgundy',
							customer: {
								name: { first: null, last: null },
								phone: null
							},
							price: 22.5,
							type: ''
						}
					});
				} );
				test( 'completes `store.setState` method call if `setState` prehook returns TRUTHY', async () => {
					const { renderCount } : PerfValue = perf( React );
					const prehooks = Object.freeze({ resetState: jest.fn().mockReturnValue( true ) });
					render( <Product prehooks={ prehooks } type="Computer" /> );
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.click( screen.getByRole( 'button', { name: 'reset context' } ) );
					await wait(() => {
						expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
							CapitalizedDisplay: 0,
							CustomerPhoneDisplay: 1,
							Editor: 0,
							PriceSticker: 0,
							Product: 0,
							ProductDescription: 1,
							Reset: 1,
							TallyDisplay: 1
						});
					});
					cleanupPerfTest();
				} );
				test( 'aborts `store.setState` method call if `setState` prehook returns FALSY', async () => {
					const { renderCount } : PerfValue = perf( React );
					const prehooks = Object.freeze({ resetState: jest.fn().mockReturnValue( false ) });
					render( <Product prehooks={ prehooks } type="Computer" /> );
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.click( screen.getByRole( 'button', { name: 'reset context' } ) );
					await wait(() => {
						expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
							CapitalizedDisplay: 0,
							CustomerPhoneDisplay: 0,
							Editor: 0,
							PriceSticker: 0,
							Product: 0,
							ProductDescription: 0,
							Reset: 0,
							TallyDisplay: 0
						});
					});
					cleanupPerfTest();
				} );
			} );
		} );
		describe( 'setState prehook', () => {
			describe( 'when `setState` prehook does not exist on the context', () => {
				test( 'completes `store.setState` method call', async () => {
					const { renderCount } : PerfValue = perf( React );
					const prehooks = Object.freeze( expect.any( Object ) );
					render( <Product prehooks={ prehooks } type="Computer" /> );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
							CapitalizedDisplay: 0,
							CustomerPhoneDisplay: 1,
							Editor: 0,
							PriceSticker: 0,
							Product: 0,
							ProductDescription: 1,
							Reset: 1,
							TallyDisplay: 1
						});
					});
					cleanupPerfTest();
				} );
			} );
			describe( 'when `setState` prehook exists on the context', () => {
				test( 'is called by the `store.setState` method', async () => {
					const prehooks = Object.freeze({ setState: jest.fn().mockReturnValue( false ) });
					render( <Product prehooks={ prehooks } type="Computer" /> );
					prehooks.setState.mockClear();
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					expect( prehooks.setState ).toHaveBeenCalledTimes( 1 );
					expect( prehooks.setState ).toHaveBeenCalledWith({ type: 'Bag' });
				} );
				test( 'completes `store.setState` method call if `setState` prehook returns TRUTHY', async () => {
					const { renderCount } : PerfValue = perf( React );
					const prehooks = Object.freeze({ setState: jest.fn().mockReturnValue( true ) });
					render( <Product prehooks={ prehooks } type="Computer" /> );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
							CapitalizedDisplay: 0,
							CustomerPhoneDisplay: 1,
							Editor: 0,
							PriceSticker: 0,
							Product: 0,
							ProductDescription: 1,
							Reset: 1,
							TallyDisplay: 1,
						});
					});
					cleanupPerfTest();
				}, 3e4 );
				test( 'aborts `store.setState` method call if `setState` prehook returns FALSY', async () => {
					const { renderCount } : PerfValue = perf( React );
					const prehooks = Object.freeze({ setState: jest.fn().mockReturnValue( false ) });
					render( <Product prehooks={ prehooks } type="Computer" /> );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						expect( transformRenderCount( renderCount, baseRenderCount ) ).toEqual({
							CapitalizedDisplay: 0,
							CustomerPhoneDisplay: 0,
							Editor: 0,
							PriceSticker: 0,
							Product: 0,
							ProductDescription: 0,
							Reset: 0,
    						TallyDisplay: 0,
						});
					});
					cleanupPerfTest();
				} );
			} );
		} );
	} );
	describe( 'API', () => {
		describe( 'connect(...)', () => {
			let state : { items : Array<{name: string}> };
			let ObservableContext : ObservableContextType<typeof state>;
			let selectorMap : { all : string; box : string; };
			let connector : Function;
			let ConnectedComponent1 : ConnectedComponent<ExtractInjectedProps<typeof state, typeof selectorMap>>;
			let ConnectedComponent2 : ConnectedComponent<ExtractInjectedProps<typeof state, typeof selectorMap>>;
			let ConnectedRefForwardingComponent : React.ForwardRefExoticComponent<React.RefAttributes<unknown>>;
			let ConnectedMemoizedComponent : ConnectedComponent<ExtractInjectedProps<typeof state, typeof selectorMap>>;
			let compOneProps : { data : typeof selectorMap };
			let compTwoProps : { data : typeof selectorMap };
			let refForwardingCompProps : { data: typeof selectorMap };
			let memoCompProps : { data: typeof selectorMap };
			beforeAll(() => {
				state = {
					items: [
						{ name: 'box_0' },
						{ name: 'box_1' },
						{ name: 'box_2' },
						{ name: 'box_3' }
					]
				};
				ObservableContext = createContext( state );
				selectorMap = {
					all: FULL_STATE_SELECTOR,
					box: 'items.1.name'
				};
				connector = ObservableContext.connect( selectorMap );
				let rawComp : React.FC<typeof compOneProps> = props => { compOneProps = props; return null };
				ConnectedComponent1 = connector( rawComp );
				rawComp = props => { compTwoProps = props; return null };
				ConnectedComponent2 = connector( rawComp );
				let rawRefComp : React.ForwardRefRenderFunction<unknown, typeof compOneProps> = props => {
					refForwardingCompProps = props;
					return null;
				};
				const RefForwardingComponent = React.forwardRef( rawRefComp );
				RefForwardingComponent.displayName = 'Connect.RefForwardingComponent';
				ConnectedRefForwardingComponent = connector( RefForwardingComponent );
				rawComp = props => { memoCompProps = props; return null };
				const MemoizedComponent = React.memo( rawComp );
				MemoizedComponent.displayName = 'Connect.MemoizedComponent';
				ConnectedMemoizedComponent = connector( MemoizedComponent );
			});
			test( 'returns a function', () => expect( connector ).toBeInstanceOf( Function ) );
			describe( "returned function's return value", () => {
				beforeAll(() => {
					const Ui = () => (
						<article>
							<header>Just a Nested Content Tester</header>
							<main>
								<ConnectedComponent1 />
								<ConnectedComponent2 />
								<ConnectedRefForwardingComponent />
								<ConnectedMemoizedComponent />
							</main>
							<footer>The End</footer>
						</article>
					);
					render( <Ui /> );
				});
				test( 'is always a memoized component', () => {
					expect( 'compare' in ConnectedComponent1 ).toBe( true );
					expect( 'compare' in ConnectedComponent2 ).toBe( true );
					expect( 'compare' in ConnectedRefForwardingComponent ).toBe( true );
					expect( 'compare' in ConnectedMemoizedComponent ).toBe( true );
				} );
				test( 'is always interested in the same context state data', () => {
					expect( compOneProps.data ).toStrictEqual( compTwoProps.data );
					expect( compOneProps.data ).toStrictEqual( refForwardingCompProps.data );
					expect( compOneProps.data ).toStrictEqual( memoCompProps.data );
				} );
				test( "contains the store's public API", () => {
					const data : Record<string, unknown> = {};
					for( const k in selectorMap ) { data[ k ] = expect.anything() }
					expect( compOneProps ).toEqual({
						data,
						resetState: expect.any( Function ),
						setState: expect.any( Function )
					});
				} );
				test( 'accepts own props (i.e. additional props at runtime)', () => {
					let capturedProps;
					const selectorMap = {
						fullBox2: 'items[1]',
						nameFirstBox: 'items.0.name'
					};
					const ownProps = {
						anotherOwnProp: expect.anything(),
						ownProp: expect.anything()
					};
					const WrappedComponent : React.ComponentType<ConnectProps<
						typeof ownProps,
						typeof state,
						typeof selectorMap
					>> = props => {
						capturedProps = props;
						return ( <div /> );
					};
					const ConnectedComponent = ObservableContext.connect( selectorMap )( WrappedComponent );
					const App = () => (
						<ConnectedComponent { ...ownProps } ref={ React.useRef() } />
					);
					render( <App /> );
					const data : Record<string, unknown>  = {};
					for( const k in selectorMap ) { data[ k ] = expect.anything() }
					expect( capturedProps ).toEqual({
						...ownProps,
						data,
						resetState: expect.any( Function ),
						setState: expect.any( Function )
					});
				} );
				describe( 'prop name conflict resolution: ownProps vs store API props', () => {
					test( 'defaults to ownProps', () => {
						const ownProps = {
							data: {
								anotherOwnProp: expect.anything(),
								ownProp: expect.anything()
							}
						};
						let capturedProps : Record<string,unknown> = {};
						const selectorMap = {
							fullBox2: 'items[1]',
							nameFirstBox: 'items.0.name'
						};
						const T : React.FC<typeof capturedProps> = props => {
							capturedProps = props;
							return null
						};
						const ConnectedComponent = ObservableContext.connect( selectorMap )( T );
						render( <ConnectedComponent { ...ownProps } /> );
						const data : Record<string,unknown> = {};
						for( const k in selectorMap ) { data[ k ] = expect.anything() }
						expect( capturedProps ).toEqual({
							...ownProps, // using `data` from ownProps
							resetState: expect.any( Function ),
							setState: expect.any( Function )
						});
					} );
				} );
			} );
		} );
		describe( 'createContext(...)', () => {
			let ObservableContext : ObservableContextType<Partial<TestState>>;
			beforeEach(() => {
				ObservableContext = createContext( defaultState as Partial<TestState> );
			});
			afterEach(() => { ObservableContext.dispose() });
			test( 'returns observable context instance', () => {
				expect( ObservableContext ).toBeInstanceOf( ObservableContextType );
			} );
			describe( 'Context property', () => {
				test( 'provides store object reference for external exposure', () => {
					expect( ObservableContext.store ).toStrictEqual(
						expect.objectContaining({
							getState: expect.any( Function ),
							resetState: expect.any( Function ),
							setState: expect.any( Function ),
							subscribe: expect.any( Function )
						})
					);
				} );
				describe( 'accessing the state', () => {
					test( 'returns entire copy of the current state by default', () => {
						const currentState = ObservableContext.store.getState();
						expect( currentState ).not.toBe( defaultState );
						expect( currentState ).toStrictEqual( defaultState );
					} );
					test( 'returns only copy of the state targeted by property paths', () => {
						expect( ObservableContext.store.getState([
							'customer.name.last',
							'type',
							'customer.phone'
						]) ).toEqual({
							customer: {
								name: {
									last: null,
								},
								phone: null,
							},
							type: ''
						});
					} );
					describe( 'when unchanged, guarantees data consistency by ensuring that...', () => {
						function areExact( a : any, b : any ) {
							if( a !== b ) { return false };
							if( typeof a === 'object' ) {
								for( const k in a ) {
									return areExact( a[ k ], b[ k ] );
								}
							}
							return true;
						}
						test( 'same entire state is returned for all default requests', () => {
							expect( areExact(
								ObservableContext.store.getState(),
								ObservableContext.store.getState()
							) ).toBe( true );
						} );
						test( 'same values at property paths are returned when using property paths', () => {
							const pPaths = [
								'customer.name.last',
								'type',
								'customer.phone'
							];
							const s1 = ObservableContext.store.getState( pPaths );
							const s2 = ObservableContext.store.getState( pPaths );
							for( const path of pPaths ) {
								expect( areExact(
									getProperty( s1, path )._value,
									getProperty( s2, path )._value
								) ).toBe( true );
							}
						} );
						test( 'same entire state is returned if ' + FULL_STATE_SELECTOR + ' found in property paths used', () => {
							expect( areExact(
								ObservableContext.store.getState(),
								ObservableContext.store.getState([
									'customer.name.last',
									'type',
									FULL_STATE_SELECTOR,
									'customer.phone'
								])
							) ).toBe( true );
						} );
					} );
					describe( 'guarantees data immutability by ensuring by...', () => {
						test( 'returning readonly state for all default requests', () => {
							expect( isReadonly(
								ObservableContext.store.getState()
							) ).toBe( true );
						} );
						test( 'returning readonly state for when using property paths', () => {
							expect( isReadonly(
								ObservableContext.store.getState([
									'customer.name.last',
									'type',
									'customer.phone'
								])
							) ).toBe( true );
						} );
						test( 'returning entire state as readonly if ' + FULL_STATE_SELECTOR + ' found in property paths used', () => {
							expect( isReadonly(
								ObservableContext.store.getState([
									'customer.name.last',
									'type',
									FULL_STATE_SELECTOR,
									'customer.phone'
								])
							) ).toBe( true );
						} );
					} );
				} );
				test( 'updates internal state', async () => {
					const { renderCount } : PerfValue = perf( React );
					const testSelectors = [
						'color',
						'customer.name.last',
						'price'
					];
					const TestClient : React.FC<{ data : {} }> = ({ data }) => (
						<div data-testid="data-output">
							{ JSON.stringify( data ) }
						</div>
					);
					TestClient.displayName = 'TestClient';
					const ConnectedTestClient = ObservableContext.connect( testSelectors )( TestClient );
					render( <ConnectedTestClient /> );
					await wait(() => {});
					expect( ( renderCount.current.TestClient as RenderCountField ).value ).toBe( 1 );
					const currentState = ObservableContext.store.getState();
					ObservableContext.store.setState({ price: 45 });
					let newState = { ...defaultState, price: 45 };
					await wait(() => {});
					expect( ( renderCount.current.TestClient as RenderCountField ).value ).toBe( 2 );
					expect( currentState ).not.toEqual( newState );
					expect( ObservableContext.store.getState() ).toEqual( newState );
					ObservableContext.store.resetState([ FULL_STATE_SELECTOR ]); // resets store internal state
					await wait(() => {});
					expect( ( renderCount.current.TestClient as RenderCountField ).value ).toBe( 3 );
					let currentState2 = ObservableContext.store.getState();
					expect( currentState2 ).toStrictEqual( defaultState );
					expect( currentState2 ).toStrictEqual( currentState );
					ObservableContext.store.setState({ price: 300 });
					currentState2 = ObservableContext.store.getState();
					await wait(() => {});
					newState = { ...defaultState, price: 300 };
					expect( currentState2 ).toEqual( newState );
					expect( currentState2 ).not.toEqual( defaultState );
					expect( ( renderCount.current.TestClient as RenderCountField ).value ).toBe( 4 );
					// parameterless external invocation of resetState is a noop
					ObservableContext.store.resetState();
					const currentState3 = ObservableContext.store.getState();
					await wait(() => {});
					expect( ( renderCount.current.TestClient as RenderCountField ).value ).toBe( 4 );
					expect( newState ).toEqual( currentState3 );
					expect( defaultState ).not.toEqual( currentState3 );
					expect( currentState2 ).toBe( currentState3 );
					cleanupPerfTest();
				}, 3e4 );
				test( 'subscribes to state changes', async () => {
					const changes = {
						color: 'Blue',
						customer: {
							phone: '555-5000'
						}
					};
					const useTestStream = ObservableContext.useStream;
					const TestClient = () => {
						const { data, resetState, setState } = useTestStream([ FULL_STATE_SELECTOR ]);
						const doReset = useCallback(() => {
							resetState([ 'color', 'customer.phone']);
						}, [ resetState ]);
						const doSet = useCallback(() => {
							setState( changes as TestState )
						}, [ setState ]);
						return (
							<>
								<div data-testid="data-output">
									{ JSON.stringify( data ) }
								</div>
								<button
									onClick={ doSet }
									onDoubleClick={ doReset }
								/>
							</>
						);
					}
					render( <TestClient /> );
					const onChangeMock = jest.fn();
					const unsub = ObservableContext.store.subscribe( 'data-updated', onChangeMock );
					expect( onChangeMock ).not.toHaveBeenCalled();
					fireEvent.click( screen.getByRole( 'button' ) ); // triggers setState
					await wait(() => {});
					expect( onChangeMock ).toHaveBeenCalled();
					expect( onChangeMock.mock.calls[ 0 ][ 0 ] ).toEqual( changes );
					expect( onChangeMock.mock.calls[ 0 ][ 1 ] ).toEqual([
						[ 'color' ], [ 'customer', 'phone' ]
					]);
					expect( onChangeMock.mock.calls[ 0 ][ 2 ] ).toEqual( changes );
					expect( onChangeMock.mock.calls[ 0 ][ 3 ] ).toEqual( expect.any( Function ) );
					onChangeMock.mockClear();
					fireEvent.click( screen.getByRole( 'button' ) ); // noop for repeat setState with same payload
					await wait(() => {});
					expect( onChangeMock ).not.toHaveBeenCalled();
					fireEvent.dblClick( screen.getByRole( 'button' ) ); // triggers resetState
					await wait(() => {});
					expect( onChangeMock ).toHaveBeenCalled();
					expect( onChangeMock.mock.calls[ 0 ][ 0 ] ).toEqual({
						color: {
							[ AutoImmutableModule.REPLACE_TAG]: 'Burgundy'
						},
						customer: {
							phone: {
								[ AutoImmutableModule.REPLACE_TAG ]: null
							}
						}
					});
					expect( onChangeMock.mock.calls[ 0 ][ 1 ] ).toEqual([
						[ 'color' ], [ 'customer', 'phone' ]
					]);
					expect( onChangeMock.mock.calls[ 0 ][ 2 ] ).toEqual({
						color: 'Burgundy',
						customer: {
							phone: null
						}
					});
					expect( onChangeMock.mock.calls[ 0 ][ 3 ] ).toEqual( expect.any( Function ) );
					onChangeMock.mockClear();
					unsub();
					let currDisplay = screen.getByTestId( 'data-output' ).textContent;
					fireEvent.click( screen.getByRole( 'button' ) ); // triggers setState
					await wait(() => {});
					expect( currDisplay ).not.toEqual( // change occurred
						screen.getByTestId( 'data-output' ).textContent
					);
					expect( onChangeMock ).not.toHaveBeenCalled();
					currDisplay = screen.getByTestId( 'data-output' ).textContent
					fireEvent.dblClick( screen.getByRole( 'button' ) ); // triggers resetState
					await wait(() => {});
					expect( currDisplay ).not.toEqual( // change occurred
						screen.getByTestId( 'data-output' ).textContent
					);
					expect( onChangeMock ).not.toHaveBeenCalled();
				} );
			} );
		} );
		describe( 'useStream(...)', () => {
			type handler = ( ...args : Array<unknown> ) => void;
			let Client : React.FC<{
				selectorMap? : SelectorMap,
				onChange? : handler
			}>;
			let Wrapper : React.FC<{children : React.ReactNode}>;
			let createObservable : ( value : SourceData ) => ({
				ObservableContext : ObservableContextType<typeof value>;
				Wrapper : typeof Wrapper;
			});
			let sourceData : SourceData;
			let ObservableContext : ObservableContextType<SourceData>;
			let selectorMapOnRender : Record<string, string>;
			beforeAll(() => {
				sourceData = createSourceData();
				createObservable = ( value  = sourceData ) => ({
					ObservableContext: createContext( value ),
					Wrapper: props => ( <>{ props.children }</> )
				});
				selectorMapOnRender = {
					year3: 'history.places[2].year',
					isActive: 'isActive',
					tag6: 'tags[5]'
				};
				const observable = createObservable( sourceData );
				ObservableContext = observable.ObservableContext;
				const useStream = ObservableContext.useStream;
				Wrapper = observable.Wrapper;
				/* eslint-disable react/display-name */
				Client = ({ selectorMap, onChange = ( ...args ) => {} }) => {
					const store = useStream( selectorMap );
					React.useMemo(() => onChange( store ), [ store ]);
					return (
						<div data-testid="data-output">
							{ JSON.stringify( store.data ) }
						</div>
					);
				};
				Client.displayName = 'Client';
				/* eslint-disable react/display-name */
			});
			afterAll(() => { ObservableContext.dispose() });
			test( 'returns a streaming store', () => {
				let store : Store<SourceData>;
				const onChange : handler = s => { store = s as typeof store };
				render(
					<Wrapper>
						<Client
							onChange={ onChange }
							selectorMap={{
								all: FULL_STATE_SELECTOR,
								tags: 'tags'
							}}
						/>
					</Wrapper>
				);
				expect( store! ).toEqual({
					data: {
						all: sourceData,
						tags: sourceData.tags
					},
					resetState: expect.any( Function ),
					setState: expect.any( Function )
				});
			} );
			describe( 'selectorMap update', () => {
				let selectorMapOnRerender : Record<string, string>;
				let mockGetReturnValue : AccessorResponse<SourceData>;
				beforeAll(() => {
					selectorMapOnRerender = clonedeep( selectorMapOnRender );
					selectorMapOnRerender.country3 = 'history.places[2].country';
					mockGetReturnValue = Array.from( new Set(
						Object.values( selectorMapOnRender ).concat(
							Object.values( selectorMapOnRerender )
						)
					) ).reduce(( o : Record<string, unknown>, k ) => {
						o[ k ] = null;
						return o;
					}, {}) as typeof mockGetReturnValue;
				});
				describe( 'normal flow', () => {
					test( 'adjusts the store on selctorMap change', () => {
						let _data : typeof mockGetReturnValue = {};
						const onChange = (({ data } : {
							data : typeof mockGetReturnValue
						}) => { _data = data }) as handler;
						const _selectorMapOnRender = { ...selectorMapOnRender };
						_selectorMapOnRender.company = 'company';
						const { rerender } = render(
							<Wrapper>
								<Client
									onChange={ onChange }
									selectorMap={ _selectorMapOnRender }
								/>
							</Wrapper>
						);
						expect( Object.keys( _data ) )
							.toEqual( Object.keys( _selectorMapOnRender ));
						rerender(
							<Wrapper>
								<Client
									onChange={ onChange }
									selectorMap={ selectorMapOnRerender }
								/>
							</Wrapper>
						);
						expect( Object.keys( _data ) )
							.toEqual( Object.keys( selectorMapOnRerender ) );
					});
					describe( 'when the new selectorMap is not empty', () => {
						test( 'refreshes state data', () => {
							let _data : typeof mockGetReturnValue = {};
							const onChange = (({ data } : {
								data : typeof mockGetReturnValue
							}) => { _data = data }) as handler;
							const { rerender } = render(
								<Wrapper>
									<Client onChange={ onChange } />
								</Wrapper>
							);
							expect( _data ).toEqual({});
							rerender(
								<Wrapper>
									<Client
										onChange={ onChange }
										selectorMap={ selectorMapOnRerender }
									/>
								</Wrapper>
							);
							expect( Object.keys( _data ) )
								.toEqual( Object.keys( selectorMapOnRerender ));
						});
					});
				} );
				describe( 'accepting an array of propertyPaths in place of a selector map', () => {
					let store : Store<SourceData>;
					beforeAll(() => {
						const onChange : handler = s => { store = s as typeof store };
						render(
							<Wrapper>
								<Client onChange={ onChange } selectorMap={[
									...Object.values( selectorMapOnRender ),
									FULL_STATE_SELECTOR
								]} />
							</Wrapper>
						);
					});
					test( 'produces an indexed-based context state data object', () => {
						const stateSource = createSourceData();
						expect( store.data ).toStrictEqual({
							0: stateSource.history.places[ 2 ].year,
							1: stateSource.isActive,
							2: stateSource.tags[ 5 ],
							3: stateSource
						});
					} );
				} );
				describe( 'when the new selectorMap is empty', () => {
					describe( 'and existing data is not empty', () => {
						test( 'adjusts the store on selctorMap change', () => {
							let _data : typeof mockGetReturnValue = {};
							const onChange = (({ data } : {
								data : typeof mockGetReturnValue
							}) => { _data = data }) as handler;
							const { rerender } = render(
								<Wrapper>
									<Client
										onChange={ onChange }
										selectorMap={ selectorMapOnRender }
									/>
								</Wrapper>
							);
							expect( Object.keys( _data ) )
								.toEqual( Object.keys( selectorMapOnRender ));
							rerender(
								<Wrapper>
									<Client onChange={ onChange } />
								</Wrapper>
							);
							expect( _data ).toEqual({});
						} );
						test( 'refreshes state data with empty object', async () => {
							const { rerender } = render(
								<Wrapper>
									<Client selectorMap={ selectorMapOnRender } />
								</Wrapper>
							);
							await wait(() => {});
							expect( screen.getByTestId( 'data-output' ).textContent ).not.toEqual( '{}' );
							rerender( <Wrapper><Client /></Wrapper> );
							await wait(() => {});
							expect( screen.getByTestId( 'data-output' ).textContent ).toEqual( '{}' );
						} );
					} );
					describe( 'and existing data is empty', () => {
						test( 'leaves the store as-is on selctorMap change', async () => {
							let _origData : typeof mockGetReturnValue = {};
							let _data : typeof mockGetReturnValue = {};
							const onChange = (({ data } : {
								data : typeof mockGetReturnValue
							}) => { _data = data }) as handler;
							const { rerender } = render(
								<Wrapper>
									<Client
										onChange={ onChange }
										selectorMap={{}}
									/>
								</Wrapper>
							);
							await wait(() => {});
							_origData = _data;
							expect( _origData ).toEqual({});
							rerender(
								<Wrapper>
									<Client
										onChange={ onChange }
										selectorMap={{}}
									/>
								</Wrapper>
							);
							await wait(() => {});
							expect( _data ).toBe( _origData );
						} );
						test( 'performs no state data update', async () => {
							const { rerender } = render( <Wrapper><Client /></Wrapper> );
							await wait(() => {});
							const origDisplay = screen.getByTestId( 'data-output' ).textContent;
							expect( origDisplay ).toEqual( '{}' );
							rerender( <Wrapper><Client selectorMap={{}} /></Wrapper> );
							await wait(() => {});
						} );
					} );
				} );
			} );
			describe( 'store.data', () => {
				interface Artefact<T extends {}> {
					Client : React.FC<{selectorMap? : SelectorMap}>,
					meta : { store : Store<T> }
				};
				let setup : <T extends {}>( ctx : ObservableContextType<T> ) => Artefact<T>;
				beforeAll(() => {
					setup = ctx => {
						let meta = { store : {}  };
						const useStream = ctx.useStream;
						const Client : React.FC<{selectorMap : SelectorMap}> = ({
							selectorMap
						}) => {
							meta.store = useStream( selectorMap );
							return null;
						};
						Client.displayName = 'Client';
						return { Client, meta } as Artefact<typeof ctx extends ObservableContextType<infer U> ? U : unknown>;
					};
				});
				test( 'carries the latest state data as referenced by the selectorMap', async () => {
					const { ObservableContext, Wrapper } = createObservable( sourceData );
					const { Client, meta } = setup( ObservableContext );
					render(
						<Wrapper>
							<Client selectorMap={{
								city3: 'history.places[2].city',
								country3: 'history.places[2].country',
								friends: 'friends',
								year3: 'history.places[2].year',
								isActive: 'isActive',
								tag6: 'tags[5]',
								tag7: 'tags[6]',
								tags: 'tags'
							}} />
						</Wrapper>
					);
					const defaultState = createSourceData();
					const expectedValue = {
						city3: defaultState.history.places[ 2 ].city,
						country3: defaultState.history.places[ 2 ].country,
						friends: defaultState.friends,
						year3: defaultState.history.places[ 2 ].year,
						isActive: defaultState.isActive,
						tag6: defaultState.tags[ 5 ],
						tag7: defaultState.tags[ 6 ],
						tags: defaultState.tags
					};
					expect( meta.store.data ).toEqual( expectedValue );
					meta.store.setState({
						friends: {
							[ AutoImmutableModule.MOVE_TAG ]: [ -1, 1 ]
						},
						isActive: true,
						history: {
							places: {
								2: {
									city: 'Marakesh',
									country: 'Morocco'
								}
							}
						},
						tags: { [ AutoImmutableModule.DELETE_TAG ]: [ 3, 5 ] }
					} as unknown as SourceData );
					await new Promise( resolve => setTimeout( resolve, 10 ) );
					expect( meta.store.data ).toEqual({
						...expectedValue,
						city3: 'Marakesh',
						country3: 'Morocco',
						friends: [ 0, 2, 1 ].map( i => defaultState.friends[ i ] ),
						isActive: true,
						tag6: undefined,
						tag7: undefined,
						tags: [ 0, 1, 2, 4, 6 ].map( i => defaultState.tags[ i ] )
					});
					ObservableContext.dispose();
				}, 3e4 );
				test( 'holds the complete current state object whenever `@@STATE` entry appears in the selectorMap', async () => {
					const { ObservableContext, Wrapper } = createObservable( createSourceData() );
					const { Client, meta } = setup( ObservableContext );
					render(
						<Wrapper>
							<Client selectorMap={{
								city3: 'history.places[2].city',
								country3: 'history.places[2].country',
								year3: 'history.places[2].year',
								isActive: 'isActive',
								tag6: 'tags[5]',
								tag7: 'tags[6]',
								state: '@@STATE'
							}} />
						</Wrapper>
					);
					const defaultState = createSourceData();
					const expectedValue = {
						city3: defaultState.history.places[ 2 ].city,
						country3: defaultState.history.places[ 2 ].country,
						year3: defaultState.history.places[ 2 ].year,
						isActive: defaultState.isActive,
						tag6: defaultState.tags[ 5 ],
						tag7: defaultState.tags[ 6 ],
						state: defaultState
					};
					expect( meta.store.data ).toEqual( expectedValue );
					meta.store.setState({
						isActive: true,
						history: {
							places: {
								2: {
									city: 'Marakesh',
									country: 'Morocco'
								}
							}
						}
					} as unknown as SourceData );
					const updatedDataEquiv = createSourceData();
					updatedDataEquiv.history.places[ 2 ].city = 'Marakesh';
					updatedDataEquiv.history.places[ 2 ].country = 'Morocco';
					updatedDataEquiv.isActive = true;
					expect( meta.store.data ).toEqual({
						...expectedValue,
						city3: 'Marakesh',
						country3: 'Morocco',
						isActive: true,
						state: updatedDataEquiv
					});
					ObservableContext.dispose();
				} );
				test( 'holds an empty object when no renderKeys provided ', async () => {
					const { ObservableContext, Wrapper } = createObservable( createSourceData() );
					const { Client, meta } = setup( ObservableContext );
					render( <Wrapper><Client /></Wrapper> );
					await wait(() => {});
					expect( meta.store.data ).toEqual({});
					meta.store.setState({ // can still update state
						isActive: true,
						history: {
							places: {
								2: {
									city: 'Marakesh',
									country: 'Morocco'
								}
							}
						}
					} as unknown as SourceData );
					await wait(() => {});
					expect( meta.store.data ).toEqual({});
					ObservableContext.dispose();
				} );
			} );
			describe( 'store.resetState', () => {
				let sourceData : SourceData;
				let Client : React.FC<{
					selectorMap? : Record<string, string>;
					resetPaths? : Array<string>
				}>;
				let ObservableContext : ObservableContextType<SourceData>;
				beforeAll(() => { sourceData = createSourceData() });
				beforeEach(() => {
					ObservableContext = createContext( sourceData );
					const useStream = ObservableContext.useStream;
					Client = props => {
						const { data, resetState } = useStream( props.selectorMap );
						const doReset = useCallback(() => {
							resetState( props.resetPaths );
						}, [ resetState ]);
						return (
							<>
								<div data-testid="data-output">
									{ JSON.stringify( data ) }
								</div>
								<button onClick={ doReset } />
							</>
						);
					};
				});
				afterEach(() => { ObservableContext.dispose() });
				describe( 'when selectorMap is present in the consumer', () => {
					describe( 'and called with own property paths arguments to reset', () => {
						test( 'resets with original slices and removes non-original slices for entries found in property paths', async () => {
							const args = [ 'blatant', 'tags[5]', 'company', 'history.places[2].year', 'xylophone', 'yodellers', 'zenith' ];
							render(
								<Wrapper>
									<Client
										selectorMap={ selectorMapOnRender }
										resetPaths={ args }
									/>
								</Wrapper>
							);
							await wait(() => {});
							const isActive2 = !sourceData.isActive;
							expect( screen.getByTestId( 'data-output' ).textContent )
								.toEqual( JSON.stringify({
									year3: sourceData.history.places[2].year,
									isActive: sourceData.isActive,
									tag6: sourceData.tags[ 5 ]
								}) );
							ObservableContext.store.setState({
								history: { places: { 2: { year: '3035' } } },
								isActive: isActive2,
								tags: { 5: 'JUST-TESTING' }
							} as unknown as SourceData );
							await wait(() => {});
							expect( screen.getByTestId( 'data-output' ).textContent )
								.toEqual( JSON.stringify({
									year3: '3035',
									isActive: isActive2,
									tag6: 'JUST-TESTING'
								}) );
							expect( ObservableContext.store.getState() ).toEqual({
								...sourceData,
								history: (() => {
									const places = [ ...sourceData.history.places ];
									places[ 2 ] = { ...places[ 2 ], year: '3035' };
									return { ...sourceData.history, places };
								})(),
								isActive: isActive2,
								tags: (() => {
									const tags = [ ...sourceData.tags ];
									tags[ 5 ] = 'JUST-TESTING';
									return tags;
								})()
							});
							fireEvent.click( screen.getByRole( 'button' ) );
							await wait(() => {});
							expect( screen.getByTestId( 'data-output' ).textContent )
								.toEqual( JSON.stringify({
									year3: sourceData.history.places[2].year,
									isActive: isActive2,
									tag6: sourceData.tags[ 5 ]
								}) );
							expect( ObservableContext.store.getState() ).toEqual({
								...sourceData, isActive: isActive2
							});
						} );
					} );
				} );
				describe( 'when selectorMap is NOT present in the consumer', () => {
					describe( 'and called with own property paths arguments to reset', () => {
						test( 'resets with original slices and removes non-original slices for entries found in property paths', async () => {
							const args = [ 'blatant', 'company', 'xylophone', 'yodellers', 'zenith' ];
							render( <Wrapper><Client resetPaths={ args } /></Wrapper> );
							await wait(() => {});
							const origTextContent = screen.getByTestId( 'data-output' ).textContent;
							expect( origTextContent ).toEqual( '{}' );
							ObservableContext.store.setState({
								blatant: true,
								company: 'SOME NEW TEST INC.',
								xylophone: 'Ruggedly melodic', 
								yodellers: 'Cartoonishly joyful'
							} as unknown as SourceData );
							await wait(() => {});
							expect( screen.getByTestId( 'data-output' ).textContent ).toBe( origTextContent );
							expect( ObservableContext.store.getState() ).toEqual({
								...sourceData,
								blatant: true,
								company: 'SOME NEW TEST INC.',
								xylophone: 'Ruggedly melodic', 
								yodellers: 'Cartoonishly joyful'
							});
							fireEvent.click( screen.getByRole( 'button' ) );
							await wait(() => {});
							expect( screen.getByTestId( 'data-output' ).textContent ).toBe( origTextContent );
							expect( ObservableContext.store.getState() ).toEqual( sourceData );
						} );
					} );
					describe( 'and called with NO own property paths arguments to reset', () => {
						test( 'results in no-op', async () => {
							render( <Wrapper><Client /></Wrapper> );
							await wait(() => {});
							const origTextContent = screen.getByTestId( 'data-output' ).textContent;
							expect( origTextContent ).toEqual( '{}' );
							ObservableContext.store.setState({
								blatant: true,
								company: 'SOME NEW TEST INC.',
								xylophone: 'Ruggedly melodic', 
								yodellers: 'Cartoonishly joyful'
							} as unknown as SourceData );
							await wait(() => {});
							expect( screen.getByTestId( 'data-output' ).textContent ).toBe( origTextContent );
							
							const alteredState = ObservableContext.store.getState();
							expect( alteredState ).toEqual({
								...sourceData,
								blatant: true,
								company: 'SOME NEW TEST INC.',
								xylophone: 'Ruggedly melodic', 
								yodellers: 'Cartoonishly joyful'
							});
							fireEvent.click( screen.getByRole( 'button' ) );
							await wait(() => {});
							expect( screen.getByTestId( 'data-output' ).textContent ).toBe( origTextContent );
							expect( ObservableContext.store.getState() ).toBe( alteredState );						} );
					} );
				} );
			} );
		} );
		describe( 'dispose(...)', () => {
			test( 'manually releases memory before exiting', () => {
				const ctx = createContext( defaultState );
				expect( ctx.closed ).toBe( false );
				const Client = ctx.connect({
					cp: 'customer.phone',
					p: 'price',
					t: 'type'
				})(({ data }) => (
					<div data-testId="data-output">
						{ JSON.stringify( data ) }
					</div>
				));
				render( <Client /> );
				expect( ctx.store.getState() ).toEqual( defaultState );
				const dataDisplay = screen.getByTestId( 'data-output' ).textContent;
				expect( dataDisplay ).toEqual(JSON.stringify({ cp: null, p: 22.5, t: '' }));
				ctx.dispose();
				// can no longer obtain new data
				expect( ctx.store.getState() ).toBeUndefined();
				// component stream data is frozen at the time of disposal
				expect( screen.getByTestId( 'data-output' ).textContent ).toBe( dataDisplay );
			});
		})
		describe( 'properties', () => {
			let ctx : ObservableContextType<TestState>;
			beforeAll(() => { ctx = createContext() });
			afterAll(() => { ctx.dispose() });
			test( 'receives and furnishes prehooks', () => {
				const prehooks = {
					resetState: jest.fn(),
					setState: jest.fn()
				} as unknown as Prehooks<TestState>;
				ctx.prehooks = prehooks;
				expect( ctx.prehooks ).toBe( prehooks );
				ctx.prehooks = undefined as unknown as Prehooks<TestState>;
			} );
			test( 'receives and furnishes init data storage', () => {
				const storage = {
					getItem: jest.fn(),
					removeItem: jest.fn(),
					setItem: jest.fn()
				} as unknown as IStorage<TestState>;
				ctx.storage = storage;
				expect( ctx.storage ).toBe( storage );
				ctx.storage = undefined as unknown as IStorage<TestState>;
			} );
			// @todo
			test( 'furnishes external store reference: readonly', () => {
			} );
			// @todo
			test( 'furnishes useStream hook: readonly', () => {
				const prehooks = {
					resetState: jest.fn(),
					setState: jest.fn()
				} as unknown as Prehooks<TestState>;
				ctx.prehooks = prehooks;
				expect( ctx.prehooks ).toBe( prehooks );
				ctx.prehooks = undefined as unknown as Prehooks<TestState>;
			} );
		} );
	} );
} );
