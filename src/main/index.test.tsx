import { AccessorResponse } from '@webkrafters/auto-immutable';

import {
	FULL_STATE_SELECTOR,
	type ConnectedComponent,
	type ConnectProps,
	type ExtractInjectedProps,
	type SelectorMap,
	type Store,
	type StoreRef
} from '..';

import getProperty from '@webkrafters/get-property';

import React, {
	useRef,
	useEffect,
	useCallback
} from 'react';

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
	// connect,
	createContext,
	// mkReadonly,
	ObservableContext as ObservableContextType,
	// UsageError,
	// useContext
} from '.';

import { isReadonly } from '../test-artifacts/utils';

import createSourceData, {
	type SourceData
} from '../test-artifacts/data/create-state-obj';

import AppNormal, {
	defaultState,
	ObservableContext,
	Product,
	TallyDisplay,
	useStream,
	TestState
} from './test-apps/normal';
import AppWithConnectedChildren from './test-apps/with-connected-children';
import AppWithPureChildren from './test-apps/with-pure-children';
import { EagleEyeContext } from '@webkrafters/eagleeye';

// import {
// 	DELETE_TAG,
// 	FULL_STATE_SELECTOR,
// 	MOVE_TAG,
// 	REPLACE_TAG
// } from '../constants';

type PerfValue = PerfTools<DefaultPerfToolsField>;

const { default: AutoImmutable } = AutoImmutableModule;

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
	describe( 'createContext(...)', () => {
		test( 'returns an observable context instance', () => {
			expect( createContext() ).toBeInstanceOf( ObservableContext );
		} );
	} );
	describe( 'Provider-less', () => {
		let sourceData : SourceData;
		let obsCtx : ObservableContextType<SourceData>;
		beforeAll(() => {
			sourceData = createSourceData();
			obsCtx = createContext( sourceData );
		});
		afterAll(() => { obsCtx.dispose() });
		test( 'can be used in any part of the application', () => {
			
		} );
	} );
} );

describe( 'ReactObservableContext', () => {
	describe( 'store updates from within the Provider tree', () => {
		describe( 'updates only subscribed components', () => {
			describe( 'using connected store subscribers', () => {
				test( 'scenario 1', async () => {
					const { renderCount } : PerfValue = perf( React );
					render( <AppWithConnectedChildren /> );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Price:' ), { target: { value: '123' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update price' } ) );
					await wait(() => {
						const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.PriceSticker ).toBe( 1 );
						expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.TallyDisplay ).toBe( 1 );
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
						const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product color data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product color data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product color data
						expect( netCount.ProductDescription ).toBe( 1 );
						expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product color data
						expect( netCount.TallyDisplay ).toBe( 1 );
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
						const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.ProductDescription ).toBe( 1 );
						expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.TallyDisplay ).toBe( 1 );
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
						const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no new product type data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no new product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no new product type data
						expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no new product type data
						expect( netCount.Reset ).toBe( 0 ); // unaffected: no new product type data
						expect( netCount.TallyDisplay ).toBe( 0 ); // unaffected: no new product type data
					});
					cleanupPerfTest();
				} );
			} );
	 		describe( 'using pure-component store subscribers', () => {
				test( 'scenario 1', async () => {
					const { renderCount } : PerfValue = perf( React );
					render( <AppWithPureChildren /> );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Price:' ), { target: { value: '123' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update price' } ) );
					await wait(() => {
						const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.PriceSticker ).toBe( 1 );
						expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.TallyDisplay ).toBe( 1 );
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
						const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product color data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product color data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product color data
						expect( netCount.ProductDescription ).toBe( 1 );
						expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product color data
						expect( netCount.TallyDisplay ).toBe( 1 );
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
						const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.ProductDescription ).toBe( 1 );
						expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.TallyDisplay ).toBe( 1 );
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
						const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 );
						expect( netCount.Editor ).toBe( 0 );
						expect( netCount.PriceSticker ).toBe( 0 );
						expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no new product type data
						expect( netCount.Reset ).toBe( 0 );
						expect( netCount.TallyDisplay ).toBe( 0 ); // unaffected: no new product type data
					});
					cleanupPerfTest();
				} );
			} );
			describe( 'using non pure-component store subscribers', () => {
				test( 'scenario 1', async () => {
					const { renderCount } : PerfValue = perf( React );
					render( <AppNormal /> );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Price:' ), { target: { value: '123' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update price' } ) );
					await wait(() => {
						const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
						expect( netCount.CustomerPhoneDisplay ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product price data
						expect( netCount.PriceSticker ).toBe( 1 );
						expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no use for product price data
						expect( netCount.Reset ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.TallyDisplay ).toBe( 1 );
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
						const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
						expect( netCount.CustomerPhoneDisplay ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product price data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product price data
						expect( netCount.ProductDescription ).toBe( 1 );
						expect( netCount.Reset ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.TallyDisplay ).toBe( 1 );
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
						const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
						expect( netCount.CustomerPhoneDisplay ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.ProductDescription ).toBe( 1 );
						expect( netCount.Reset ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.TallyDisplay ).toBe( 1 );
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
						const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 );
						expect( netCount.Editor ).toBe( 0 );
						expect( netCount.PriceSticker ).toBe( 0 );
						expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no new product type data
						expect( netCount.Reset ).toBe( 0 );
						expect( netCount.TallyDisplay ).toBe( 0 ); // unaffected: no new product type data
					});
					cleanupPerfTest();
				} );
			} );
		} );
	} );
	describe( 'store updates from outside the Provider tree', () => {
		describe( 'with connected component children', () => {
			test( 'only re-renders Provider children affected by the Provider parent prop change', async () => {
				const { renderCount } : PerfValue = perf( React );
				render( <AppWithConnectedChildren /> );
				let baseRenderCount : Record<string,any>;
				await wait(() => { baseRenderCount = transformRenderCount( renderCount ); });
				fireEvent.keyUp( screen.getByLabelText( 'Type:' ), { target: { value: 'A' } } );
				await wait(() => {
					const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
					expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.ProductDescription ).toBe( 1 );
					expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.TallyDisplay ).toBe( 1 );
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
					const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
					expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.PriceSticker ).toBe( 1 );
					expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.TallyDisplay ).toBe( 1 );
				});
				cleanupPerfTest();
			} );
	 	} );
		describe( 'with pure-component children', () => {
			test( 'only re-renders Provider children affected by the Provider parent prop change', async () => {
				const { renderCount } : PerfValue = perf( React );
				render( <AppWithPureChildren /> );
				let baseRenderCount : Record<string,any>;
				await wait(() => { baseRenderCount = transformRenderCount( renderCount ); });
				fireEvent.keyUp( screen.getByLabelText( 'Type:' ), { target: { value: 'A' } } );
				await wait(() => {
					const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
					expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.ProductDescription ).toBe( 1 );
					expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.TallyDisplay ).toBe( 1 );
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
					const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
					expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.PriceSticker ).toBe( 1 );
					expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.TallyDisplay ).toBe( 1 );
				});
				cleanupPerfTest();
			} );
		} );
		describe( 'with non pure-component children ', () => {
			test( 'only re-renders Provider children affected by the Provider parent prop change', async () => {
				const { renderCount } : PerfValue = perf( React );
				render( <AppNormal /> );
				let baseRenderCount : Record<string,any>;
				await wait(() => { baseRenderCount = transformRenderCount( renderCount ); });
				fireEvent.keyUp( screen.getByLabelText( 'Type:' ), { target: { value: 'A' } } );
				await wait(() => {
					const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
					expect( netCount.CustomerPhoneDisplay ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
					expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.ProductDescription ).toBe( 1 );
					expect( netCount.Reset ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
					expect( netCount.TallyDisplay ).toBe( 1 );
				});
				cleanupPerfTest();
			} );
			test( 'oonly re-renders parts of the Provider tree directly affected by the Provider parent state update', async () => {
				const { renderCount } : PerfValue = perf( React );
				render( <AppNormal /> );
				let baseRenderCount : Record<string,any>;
				await wait(() => { baseRenderCount = transformRenderCount( renderCount ); });
				fireEvent.keyUp( screen.getByLabelText( '$', { key: '5', code: 'Key5' } as SelectorMatcherOptions ) );
				await wait(() => {
					const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
					expect( netCount.CustomerPhoneDisplay ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
					expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.PriceSticker ).toBe( 1 );
					expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.Reset ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
					expect( netCount.TallyDisplay ).toBe( 1 );
				});
				cleanupPerfTest();
			} );
		} );
	} );
	describe( 'accessing store externally through its provider', () => {
		const sourceData = createSourceData();
		let storeRef : React.RefObject<StoreRef<Partial<SourceData>>>;
		let ObservableContext : ObservableContextType<Partial<SourceData>>;
		let TestComp : React.FC<{children?:React.ReactNode}>;
		beforeAll(() => {
			ObservableContext = createContext();
			TestComp = ({ children }) => {
				const ref = useRef<StoreRef<Partial<SourceData>>>( null );
				useEffect(() => { storeRef = ref }, []);
				return (
					<ObservableContext.Provider
						children={ children }
						ref={ ref }
						value={ sourceData }
					/>
				)
			}
		});
		test( 'is successful', () => {
			storeRef = undefined as unknown as typeof storeRef;
			render( <TestComp /> );
			expect( storeRef.current ).toEqual(
				expect.objectContaining({
					getState: expect.any( Function ),
					resetState: expect.any( Function ),
					setState: expect.any( Function ),
					subscribe: expect.any( Function )
				})
			);	
		});
		test( 'can read the current store data', async () => {
			storeRef = undefined as unknown as typeof storeRef;
			const NEW_AGE = 71;
			const Child =  ObservableContext.connect()(({ setState }) => {
				const setAge = React.useCallback(
					() => setState({ age: NEW_AGE }),
					[ setState ]
				);
				return ( <button value="set age" onClick={ setAge } /> );
			});
			render( <TestComp><Child /></TestComp> );
			expect( storeRef.current!.getState().age ).toBe( sourceData.age );
			fireEvent.click( screen.getByRole( 'button' ) );
			expect( storeRef.current!.getState().age ).toBe( NEW_AGE );
			cleanupPerfTest();
		});
		test( 'can update store and propagate observing components', async () => {
			storeRef = undefined as unknown as typeof storeRef;
			const Child =  ObservableContext.connect({
				fName: 'name.first'
			})(({ data: { fName } }) => (
				<>They call me: <span data-testid="fname">{ fName }</span></>
			));
			render( <TestComp><Child /></TestComp> );
			expect( screen.getByTestId( 'fname' ).textContent )
				.toEqual( sourceData.name.first );
			const NEW_FNAME = 'Imagene';
			storeRef.current!.setState({
				name: {
					first: NEW_FNAME
				}
			});
			await wait(() => {
				expect( screen.getByTestId( 'fname' ).textContent )
					.toEqual( NEW_FNAME );
			});
			cleanupPerfTest();
		});
		test( 'can reset store and propagate observing components', async () => {
			storeRef = undefined as unknown as typeof storeRef;
			const NEW_EMAIL = 'some.gobbledygook.co.uk';
			const Child = ObservableContext.connect({
				myEmail: 'email'
			} )(({ data: { myEmail }, setState }) => {
				const setEmail = React.useCallback(
					() => setState({ email: NEW_EMAIL }),
					[ setState ]
				);
				return (
					<>
						<>Here is my email: <span data-testid="myemail">{ myEmail }</span></>
						<button value="set email" onClick={ setEmail } />
					</>
				);
			});
			render( <TestComp><Child /></TestComp> );
			expect( screen.getByTestId( 'myemail' ).textContent )
				.toEqual( sourceData.email );
			fireEvent.click( screen.getByRole( 'button' ) );
			await await(() => {
				expect( screen.getByTestId( 'myemail' ).textContent )
					.toEqual( NEW_EMAIL );
			});
			storeRef.current!.resetState([ 'email' ]);
			await wait(() => {
				expect( screen.getByTestId( 'myemail' ).textContent )
					.toEqual( sourceData.email );
			});
			cleanupPerfTest();
		});
		test( 'can observe state changes coming into the store', async () => {
			storeRef = undefined as unknown as typeof storeRef;
			const Child = ObservableContext.connect()(({ setState }) => {
				const setCompany : React.MouseEventHandler<HTMLButtonElement> = React.useCallback(
					e => setState({ company: ( e.target as HTMLButtonElement ).value }),
					[ setState ]
				);
				return ( <button value="set company" onClick={ setCompany } /> );
			});
			render( <TestComp><Child /></TestComp> );
			const onChangeMock = jest.fn();
			const unsub = ObservableContext.store.subscribe( 'data-updated', onChangeMock );
			const NEW_CNAME = 'What is my company name again?????';
			fireEvent.click( screen.getByRole( 'button' ), {
				target: { value: NEW_CNAME }
			});
			expect( onChangeMock ).toHaveBeenCalledTimes( 1 );
			expect( onChangeMock.mock.calls[ 0 ][ 0 ] ).toEqual({ company: NEW_CNAME });
			expect( onChangeMock.mock.calls[ 0 ][ 1 ] ).toEqual([[ 'company' ]]);
			expect( onChangeMock.mock.calls[ 0 ][ 2 ] ).toEqual({ company: NEW_CNAME });
			expect( onChangeMock.mock.calls[ 0 ][ 3 ] ).toEqual( expect.any( Function ) );
			onChangeMock.mockClear();
			const NEW_CNAME2 = 'Alright! let me tell you what\'s what!!!!!';
			fireEvent.click( screen.getByRole( 'button' ), {
				target: { value: NEW_CNAME2 }
			});
			expect( onChangeMock ).toHaveBeenCalledTimes( 1 );
			expect( onChangeMock.mock.calls[ 0 ][ 0 ] ).toEqual({ company: NEW_CNAME2 });
			expect( onChangeMock.mock.calls[ 0 ][ 1 ] ).toEqual([[ 'company' ]]);
			expect( onChangeMock.mock.calls[ 0 ][ 2 ] ).toEqual({ company: NEW_CNAME2 });
			expect( onChangeMock.mock.calls[ 0 ][ 3 ] ).toEqual( expect.any( Function ) );
			unsub(); // unsubscribe store change listener
			onChangeMock.mockClear();
			const NEW_CNAME3 = 'Geez! Did you get the name I just gave ya?????';
			fireEvent.click( screen.getByRole( 'button' ), {
				target: { value: NEW_CNAME3 }
			});
			expect( onChangeMock ).not.toHaveBeenCalled();
			cleanupPerfTest();
		});
	} );
	describe( 'prehooks', () => {
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
						const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
						expect( netCount.CustomerPhoneDisplay ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.ProductDescription ).toBe( 1 ); // DULY UPDATED WITH NEW STATE RESET
						expect( netCount.Reset ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.TallyDisplay ).toBe( 1 ); // DULY UPDATED WITH NEW STATE RESET
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
					expect( prehooks.resetState ).toHaveBeenCalledWith({
						[ AutoImmutableModule.REPLACE_TAG ]: {
							// data slices from original state to reset current state slices
							color: 'Burgundy',
							customer: {
								name: { first: null, last: null },
								phone: null
							},
							price: 22.5,
							type: 'Computer'
						}
					}, {
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
							type: 'Computer'
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
						const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;;
						expect( netCount.CustomerPhoneDisplay ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.ProductDescription ).toBe( 1 ); // DULY UPDATED WITH NEW STATE RESET
						expect( netCount.Reset ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.TallyDisplay ).toBe( 1 ); // DULY UPDATED WITH NEW STATE RESET
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
						const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.ProductDescription ).toBe( 0 ); // NORMAL UPDATE DUE CANCELED: RESET STATE ABORTED
						expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.TallyDisplay ).toBe( 0 ); // NORMAL UPDATE DUE CANCELED: RESET STATE ABORTED
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
						const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
						expect( netCount.CustomerPhoneDisplay ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.ProductDescription ).toBe( 1 ); // DULY UPDATED WITH NEW STATE CHANGE
						expect( netCount.Reset ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.TallyDisplay ).toBe( 1 ); // DULY UPDATED WITH NEW STATE CHANGE
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
						const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
						expect( netCount.CustomerPhoneDisplay ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.ProductDescription ).toBe( 1 ); // DULY UPDATED WITH NEW STATE CHANGE
						expect( netCount.Reset ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.TallyDisplay ).toBe( 1 ); // DULY UPDATED WITH NEW STATE CHANGE
					});
					cleanupPerfTest();
				} );
				test( 'aborts `store.setState` method call if `setState` prehook returns FALSY', async () => {
					const { renderCount } : PerfValue = perf( React );
					const prehooks = Object.freeze({ setState: jest.fn().mockReturnValue( false ) });
					render( <Product prehooks={ prehooks } type="Computer" /> );
					let baseRenderCount : Record<string,any>;
					await wait(() => { baseRenderCount = transformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						const netCount = transformRenderCount( renderCount, baseRenderCount ) as any;
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.ProductDescription ).toBe( 0 ); // NORMAL UPDATE DUE CANCELED: SET STATE ABORTED
						expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.TallyDisplay ).toBe( 0 ); // NORMAL UPDATE DUE CANCELED: SET STATE ABORTED
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
			test( 'returns observable context', () => {
				expect( ObservableContext ).toBeInstanceOf( ObservableContextType );
				expect( ObservableContext ).toEqual(
					expect.objectContaining({
						Consumer: expect.any( Object ),
						Provider: expect.any( Object )
					})
				);
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
					describe( 'accessing the state', () => {
						test( 'returns entire copy of the current state by default', () => {
							const currentState = ObservableContext.store.getState();
							expect( currentState ).not.toBe( defaultState );
							expect( currentState ).toStrictEqual( defaultState );
						} );
						test( 'returns only copy of the state targeted by property paths', () => {
							const expected = {
								customer: {
									name: { last: 'tLast' },
									phone: null
								},
								type: 'TEST TYPE'
							};
							const currentState = ObservableContext.store.getState([
								'customer.name.last',
								'type',
								'customer.phone'
							]);
							expect( currentState ).toEqual( expected );
						} );
						test( 'returns entire copy of the current state if ' + FULL_STATE_SELECTOR + ' found in property paths used', () => {
							expect( ObservableContext.store.getState([
								'customer.name.last',
								'type',
								'customer.phone',
								FULL_STATE_SELECTOR
							]) ).toEqual( defaultState );
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
								const pPaths = [ 'customer.name.last', 'type', 'customer.phone' ];
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
								const pPaths = [ 'customer.name.last', 'type', FULL_STATE_SELECTOR, 'customer.phone' ];
								expect( areExact(
									ObservableContext.store.getState(),
									ObservableContext.store.getState()
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
						render( <TallyDisplay /> );
						await wait(() => {});
						expect( ( renderCount.current.TallyDisplay as RenderCountField ).value ).toBe( 1 );
						const currentState = ObservableContext.store.getState();
						ObservableContext.store.setState({ price: 45 });
						let newState = { ...defaultState, price: 45 };
						await wait(() => {});
						await new Promise( resolve => setTimeout( resolve, 50 ) );
						expect( ( renderCount.current.TallyDisplay as RenderCountField ).value ).toBe( 2 );
						expect( currentState ).not.toEqual( newState );
						expect( ObservableContext.store.getState() ).toEqual( newState );
						ObservableContext.store.resetState([ FULL_STATE_SELECTOR ]); // resets store internal state
						await wait(() => {});
						await new Promise( resolve => setTimeout( resolve, 50 ) );
						expect( ( renderCount.current.TallyDisplay as RenderCountField ).value ).toBe( 3 );
						let currentState2 = ObservableContext.store.getState();
						expect( currentState2 ).toStrictEqual( defaultState );
						expect( currentState2 ).toStrictEqual( currentState );
						// alter internal state to ready for default reset feature
						ObservableContext.store.setState({ price: 300 });
						currentState2 = ObservableContext.store.getState();
						await wait(() => {});
						await new Promise( resolve => setTimeout( resolve, 50 ) );
						newState = { ...defaultState, price: 300 };
						expect( currentState2 ).toEqual( newState );
						expect( currentState2 ).not.toEqual( defaultState );
						expect( ( renderCount.current.TallyDisplay as RenderCountField ).value ).toBe( 4 );
						// default reset results in no-operation
						ObservableContext.store.resetState();
						const currentState3 = ObservableContext.store.getState();
						await wait(() => {});
						await new Promise( resolve => setTimeout( resolve, 50 ) );
						expect( ( renderCount.current.TallyDisplay as RenderCountField ).value ).toBe( 4 );
						expect( newState ).toEqual( currentState3 );
						expect( defaultState ).not.toEqual( currentState3 );
						expect( currentState2 ).toBe( currentState3 );
						cleanupPerfTest();
					}, 3e4 );
					test( 'subscribes to state changes', async () => {
						render( <TallyDisplay /> );
						const changes = { price: 45 };
						const onChangeMock = jest.fn();
						const unsub = ObservableContext.store.subscribe( 'data-updated', onChangeMock );
						expect( onChangeMock ).not.toHaveBeenCalled();
						ObservableContext.store.setState( changes );
						expect( onChangeMock ).toHaveBeenCalled();
						expect( onChangeMock.mock.calls[ 0 ][ 0 ] ).toEqual( changes );
						expect( onChangeMock.mock.calls[ 0 ][ 1 ] ).toEqual([[ 'price' ]]);
						expect( onChangeMock.mock.calls[ 0 ][ 2 ] ).toEqual( changes );
						expect( onChangeMock.mock.calls[ 0 ][ 3 ] ).toEqual( expect.any( Function ) );
						onChangeMock.mockClear();
						const changes2 = [
							{
								color: 'Navy',
								type: 'TEST TYPE_2'
							},
							{ customer: { name: { last: 'T_last_2' } } }
						];
						ObservableContext.store.setState( changes2 );
						expect( onChangeMock ).toHaveBeenCalled();
						expect( onChangeMock.mock.calls[ 0 ][ 0 ] ).toEqual( changes2 );
						expect( onChangeMock.mock.calls[ 0 ][ 1 ] ).toEqual([
							[ 'color' ],
							[ 'type' ],
							[ 'customer', 'name', 'last' ]
						]);
						expect( onChangeMock.mock.calls[ 0 ][ 2 ] ).toEqual({
							color: 'Navy',
							customer: { name: { last: 'T_last_2' } },
							type: 'TEST TYPE_2'
						});
						expect( onChangeMock.mock.calls[ 0 ][ 3 ] ).toEqual( expect.any( Function ) );
						onChangeMock.mockClear();
						ObservableContext.store.resetState([ FULL_STATE_SELECTOR ]);
						expect( onChangeMock ).toHaveBeenCalled();
						expect( onChangeMock.mock.calls[ 0 ][ 0 ] ).toEqual({
							[ AutoImmutableModule.REPLACE_TAG ]: defaultState
						});
						expect( onChangeMock.mock.calls[ 0 ][ 1 ] ).toEqual([[]]);
						expect( onChangeMock.mock.calls[ 0 ][ 2 ] ).toEqual( defaultState );
						expect( onChangeMock.mock.calls[ 0 ][ 3 ] ).toEqual( expect.any( Function ) );
						onChangeMock.mockClear();
						unsub();
						ObservableContext.store.setState( changes );
						expect( onChangeMock ).not.toHaveBeenCalled();
						ObservableContext.store.resetState([ FULL_STATE_SELECTOR ]);
						expect( onChangeMock ).not.toHaveBeenCalled();
					} );
				} );
			} );
		} );
		// @debug
		describe( '1cccc', () => {
		// describe( 'useStream(...)', () => {
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
			test( 'returns an observable context store', () => {
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
							.toEqual( Object.keys( selectorMapOnRerender ));
					});
					test( 'destroys previous and obtains new connection', () => {
						const sourceData = createSourceData();
						const cache = new AutoImmutable( sourceData );
						const connection = cache.connect();
						const disconnectSpy = jest.spyOn( connection, 'disconnect' );
						const connectSpy = jest
							.spyOn( AutoImmutable.prototype, 'connect' )
							.mockReturnValue( connection );
						const mockUnsubscribe = jest.fn();
						const testCtx = new EagleEyeContext( sourceData );
						const testChannel = testCtx.store( selectorMapOnRender );
						const subsribeSpy = jest
							.spyOn( testChannel, 'testC
						const storeSpy = jest
							.spyOn( EagleEyeContext.prototype, 'store', 'get' )
							.mockReturnValue({

							});
						
						const { rerender } = render(
							<Wrapper>
								<Client selectorMap={ selectorMapOnRender } />
							</Wrapper>
						);
						expect( connectSpy ).toHaveBeenCalledTimes( 3 );
						expect( subscribeSpy ).toHaveBeenCalledTimes( 1 );
						expect( disconnectSpy ).not.toHaveBeenCalled();
						expect( mockUnsubscribe ).not.toHaveBeenCalled();
						rerender(
							<Wrapper>
								<Client selectorMap={ selectorMapOnRerender } />
							</Wrapper>
						);
						expect( connectSpy ).toHaveBeenCalledTimes( 4 );
						expect( subscribeSpy ).toHaveBeenCalledTimes( 2 );
						expect( disconnectSpy ).toHaveBeenCalledTimes( 1 );
						expect( mockUnsubscribe ).toHaveBeenCalledTimes( 1 );

						disconnectSpy.mockRestore();
						connectSpy.mockRestore();
						subscribeSpy.mockRestore();
					});
					describe( 'when the new selectorMap is not empty', () => {
						test( 'refreshes state data', () => {
							const cache = new AutoImmutable( createSourceData() );
							const connection = cache.connect();
							const getSpy = jest
								.spyOn( connection, 'get' )
								.mockReturnValue( mockGetReturnValue );
							const connectSpy = jest
								.spyOn( cache, 'connect' )
								.mockReturnValue( connection )
							const cacheSpy = jest
								.spyOn( AutoImmutableModule, 'default' )
								.mockReturnValue( cache );
							expect( getSpy ).not.toHaveBeenCalled();
							const { rerender } = render(
								<Wrapper>
									<Client selectorMap={ selectorMapOnRender } />
								</Wrapper>
							);
							expect( getSpy ).toHaveBeenCalledTimes( 2 );
							expect( getSpy.mock.calls[ 1 ] ).toEqual(
								Object.values( selectorMapOnRender )
							);
							getSpy.mockClear();
							rerender(
								<Wrapper>
									<Client selectorMap={ selectorMapOnRerender } />
								</Wrapper>
							);
							expect( getSpy ).toHaveBeenCalledTimes( 1 );
							expect( getSpy ).toHaveBeenCalledWith(
								...Object.values( selectorMapOnRerender )
							);
							getSpy.mockRestore();
							connectSpy.mockRestore();
							cacheSpy.mockRestore();
						});
						test( 'sets up new subscription with the consumer', () => {
							const mockUnsubscribe = jest.fn();
							const base = new EagleEyeContext( sourceData );
							const subscribeSpy = jest
								.spyOn( base.store, 'subscribe' )
								.mockReturnValue( mockUnsubscribe );
							const { rerender } = render(
								<Wrapper>
									<Client selectorMap={ selectorMapOnRender } />
								</Wrapper>
							);
							expect( subscribeSpy ).toHaveBeenCalledTimes( 2 );
							expect( mockUnsubscribe ).toHaveBeenCalledTimes( 0 );
							subscribeSpy.mockRestore();
							rerender(
								<Wrapper>
									<Client selectorMap={ selectorMapOnRerender } />
								</Wrapper>
							);
							expect( subscribeSpy ).toHaveBeenCalledTimes( 2 );
							expect( mockUnsubscribe ).toHaveBeenCalledTimes( 1 );

							subscribeSpy.mockRestore();

							base.dispose();
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
									<Client
										onChange={ onChange }
										selectorMap={{}}
									/>
								</Wrapper>
							);
							expect( Object.keys( _data ) )
								.toEqual( Object.keys({}));
						} );
						test( 'destroys previous and obtains new connection', () => {
							const sourceData = createSourceData();
							const cache = new AutoImmutable( sourceData );
							const connection = cache.connect();
							const disconnectSpy = jest.spyOn( connection, 'disconnect' );
							const getSpy = jest
								.spyOn( connection, 'get' )
								.mockReturnValue( mockGetReturnValue );
							const connectSpy = jest
								.spyOn( cache, 'connect' )
								.mockReturnValue( connection )
							const cacheSpy = jest
								.spyOn( AutoImmutableModule, 'default' )
								.mockReturnValue( cache );
							const mockUnsubscribe = jest.fn();

							const base = new EagleEyeContext( sourceData );
							const subscribeSpy = jest
								.spyOn( base.store, 'subscribe' )
								.mockReturnValue( mockUnsubscribe );

							const { rerender } = render(
								<Wrapper>
									<Client selectorMap={ selectorMapOnRender } />
								</Wrapper>
							);
							expect( connectSpy ).toHaveBeenCalledTimes( 3 );
							expect( subscribeSpy ).toHaveBeenCalledTimes( 1 );
							expect( disconnectSpy ).not.toHaveBeenCalled();
							expect( mockUnsubscribe ).not.toHaveBeenCalled();
							connectSpy.mockClear();
							subscribeSpy.mockClear();
							rerender(
								<Wrapper>
									<Client selectorMap={ selectorMapOnRerender } />
								</Wrapper>
							);
							expect( connectSpy ).toHaveBeenCalledTimes( 1 );
							expect( subscribeSpy ).toHaveBeenCalledTimes( 1 );
							expect( disconnectSpy ).toHaveBeenCalledTimes( 1 );
							expect( mockUnsubscribe ).toHaveBeenCalledTimes( 1 );
							
							getSpy.mockRestore();
							subscribeSpy.mockRestore();
							connectSpy.mockRestore();
							disconnectSpy.mockRestore();
							cacheSpy.mockRestore();

							base.dispose();
						} );
						test( 'refreshes state data with empty object', async () => {
							const sourceData = createSourceData();
							const cache = new AutoImmutable( sourceData );
							const connection = cache.connect();
							const getSpy = jest
								.spyOn( connection, 'get' )
								.mockReturnValue( mockGetReturnValue );
							const connectSpy = jest
								.spyOn( cache, 'connect' )
								.mockReturnValue( connection )
							const cacheSpy = jest
								.spyOn( AutoImmutableModule, 'default' )
								.mockReturnValue( cache );

							expect( getSpy ).not.toHaveBeenCalled();
							const { rerender } = render(
								<Wrapper>
									<Client selectorMap={ selectorMapOnRender } />
								</Wrapper>
							);
							await wait(() => {});
							expect( getSpy ).toHaveBeenCalledTimes( 2 );
							expect( getSpy.mock.calls[ 1 ] ).toEqual(
								Object.values( selectorMapOnRender )
							);
							expect( screen.getByTestId( 'data-output' ).textContent ).not.toEqual( '{}' );
							getSpy.mockClear();
							rerender(
								<Wrapper>
									<Client selectorMap={{}} />
								</Wrapper>
							);
							await wait(() => {});
							expect( getSpy ).not.toHaveBeenCalled();
							expect( screen.getByTestId( 'data-output' ).textContent ).toEqual( '{}' );
							
							getSpy.mockRestore();
							connectSpy.mockRestore();
							cacheSpy.mockRestore();
						} );
						test( 'does not set up new subscription with the consumer', () => {
							const mockUnsubscribe = jest.fn();
							const base = new EagleEyeContext( sourceData );
							const subscribeSpy = jest
								.spyOn( base.store, 'subscribe' )
								.mockReturnValue( mockUnsubscribe );
							const { rerender } = render(
								<Wrapper>
									<Client selectorMap={ selectorMapOnRender } />
								</Wrapper>
							);
							expect( subscribeSpy ).toHaveBeenCalledTimes( 1 );
							expect( mockUnsubscribe ).not.toHaveBeenCalled();
							subscribeSpy.mockClear();
							rerender(
								<Wrapper>
									<Client selectorMap={{}} />
								</Wrapper>
							);
							expect( subscribeSpy ).not.toHaveBeenCalled();
							expect( mockUnsubscribe ).toHaveBeenCalledTimes( 1 );
							
							subscribeSpy.mockRestore();

							base.dispose();
						} );
					} );
					describe( 'and existing data is empty', () => {
						test( 'leaves the store as-is on selctorMap change', () => {
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
							_origData = _data;
							expect( Object.keys( _origData ) )
								.toEqual( Object.keys({}));
							rerender(
								<Wrapper>
									<Client
										onChange={ onChange }
										selectorMap={{}}
									/>
								</Wrapper>
							);
							expect( _data ).toBe( _origData );
						} );
						test( 'performs no state data update', async () => {
							const cache = new AutoImmutable( createSourceData() );
							const connection = cache.connect();
							const getSpy = jest
								.spyOn( connection, 'get' )
								.mockReturnValue( mockGetReturnValue );
							const connectSpy = jest
								.spyOn( cache, 'connect' )
								.mockReturnValue( connection )
							const cacheSpy = jest
								.spyOn( AutoImmutableModule, 'default' )
								.mockReturnValue( cache );
							expect( getSpy ).not.toHaveBeenCalled();
							const { rerender } = render(
								<Wrapper>
									<Client selectorMap={{}} />
								</Wrapper>
							);
							await wait(() => {});
							expect( getSpy ).not.toHaveBeenCalled();
							expect( screen.getByTestId( 'data-output' ).textContent ).toEqual( '{}' );
							getSpy.mockClear();
							rerender(
								<Wrapper>
									<Client selectorMap={{}} />
								</Wrapper>
							);
							await wait(() => {});
							expect( getSpy ).not.toHaveBeenCalled();
							expect( screen.getByTestId( 'data-output' ).textContent ).toEqual( '{}' );

							getSpy.mockRestore();
							connectSpy.mockRestore();
							cacheSpy.mockRestore();
						} );
						test( 'does not set up new subscription with the consumer', () => {
							const mockUnsubscribe = jest.fn();
							const mockSubscribe = jest.fn()
								.mockReturnValue( mockUnsubscribe );
							const base = new EagleEyeContext();
							const subscribeSpy = jest
								.spyOn( base.store, 'subscribe' )
								.mockReturnValue( mockSubscribe );
							const { rerender } = render(
								<Wrapper>
									<Client selectorMap={{}} />
								</Wrapper>
							);
							expect( subscribeSpy ).not.toHaveBeenCalled();
							expect( mockUnsubscribe ).not.toHaveBeenCalled();
							rerender(
								<Wrapper>
									<Client selectorMap={{}} />
								</Wrapper>
							);
							expect( subscribeSpy ).not.toHaveBeenCalled();
							expect( mockUnsubscribe ).not.toHaveBeenCalled();

							subscribeSpy.mockRestore();

							base.dispose();
						} );
						describe( 'and previous property path is empty', () => {
							test( 'skips refreshing connection: no previous connections to the consumer existed', () => {
								const sourceData = createSourceData();
								const cache = new AutoImmutable( sourceData );
								const connection = cache.connect();
								const disconnectSpy = jest.spyOn( connection, 'disconnect' );
								const getSpy = jest
									.spyOn( connection, 'get' )
									.mockReturnValue( mockGetReturnValue );
								const connectSpy = jest
									.spyOn( cache, 'connect' )
									.mockReturnValue( connection )
								const cacheSpy = jest
									.spyOn( AutoImmutableModule, 'default' )
									.mockReturnValue( cache );
								const mockUnsubscribe = jest.fn();
								const base = new EagleEyeContext( sourceData );
								const subscribeSpy = jest
									.spyOn( base.store, 'subscribe' )
									.mockReturnValue( mockUnsubscribe );
								const { rerender } = render(
									<Wrapper>
										<Client selectorMap={{}} />
									</Wrapper>
								);
								expect( connectSpy ).toHaveBeenCalledTimes( 3 );
								expect( subscribeSpy ).not.toHaveBeenCalled();
								expect( disconnectSpy ).not.toHaveBeenCalled();
								expect( mockUnsubscribe ).not.toHaveBeenCalled();
								connectSpy.mockClear();
								rerender(
									<Wrapper>
										<Client selectorMap={{}} />
									</Wrapper>
								);
								expect( connectSpy ).not.toHaveBeenCalled();
								expect( subscribeSpy ).not.toHaveBeenCalled();
								expect( disconnectSpy ).not.toHaveBeenCalled();
								expect( mockUnsubscribe ).not.toHaveBeenCalled();

								getSpy.mockRestore();
								connectSpy.mockRestore();
								subscribeSpy.mockRestore();
								disconnectSpy.mockRestore();
								cacheSpy.mockRestore();

								base.dispose();
							} );
						} );
					} );
				} );
			} );
			describe( 'store.data', () => {
				interface Artefact<T extends {}> {
					Client : React.FC<{selectorMap : SelectorMap}>,
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
					let store = {} as Store<SourceData>;
					const onChange : handler = s => { store = s as typeof store };
					render(
						<Wrapper>
							<Client onChange={ onChange } selectorMap={{
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
					expect( store.data ).toEqual( expectedValue );
					store.setState({
						friends: {
							[ AutoImmutableModule.MOVE_TAG ]: [ -1, 1 ]
						} as unknown as Array<any>,
						isActive: true,
						history: {
							places: {
								2: {
									city: 'Marakesh',
									country: 'Morocco'
								}  as SourceData["history"]["places"][0]
							} as unknown as SourceData["history"]["places"]
						},
						tags: { [ AutoImmutableModule.DELETE_TAG ]: [ 3, 5 ] } as unknown as SourceData["tags"]
					} as SourceData );
					await new Promise( resolve => setTimeout( resolve, 10 ) );
					expect( store.data ).toEqual({
						...expectedValue,
						city3: 'Marakesh',
						country3: 'Morocco',
						friends: [ 0, 2, 1 ].map( i => defaultState.friends[ i ] ),
						isActive: true,
						tag6: undefined,
						tag7: undefined,
						tags: [ 0, 1, 2, 4, 6 ].map( i => defaultState.tags[ i ] )
					});
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
					let store = {} as Store<SourceData>;
					const onChange : handler = s => { store = s as typeof store };
					render( <Wrapper><Client onChange={ onChange } /></Wrapper> );
					expect( store.data ).toEqual({});
					store.setState({ // can still update state
						isActive: true,
						history: {
							places: {
								2: {
									city: 'Marakesh',
									country: 'Morocco'
								}
							} as unknown as SourceData["history"]["places"]
						} as SourceData["history"]
					} as SourceData );
					await new Promise( resolve => setTimeout( resolve, 10 ) );
					expect( store.data ).toEqual({});
				} );
			} );
			describe( 'store.resetState', () => {
				let Client : React.FC<{
					selectorMap? : Record<string, string>;
					resetPaths? : Array<string>
				}>;
				beforeAll(() => {
					const useStream = ObservableContext.useStream;
					Client = props => {
						const { resetState } = useStream( props.selectorMap );
						const doReset = useCallback(() => {
							resetState( props.resetPaths );
						}, [ resetState ]);
						return ( <button onClick={ doReset } /> )
					};
				});
				describe( 'when selectorMap is present in the consumer', () => {
					describe( 'and called with own property paths arguments to reset', () => {
						test( 'resets with original slices and removes non-original slices for entries found in property paths', async () => {
							const sourceData = createSourceData();
							const autoImmutable = new AutoImmutable( sourceData );
							const connection = autoImmutable.connect();
							const setSpy = jest.spyOn( connection, 'set' );
							jest.spyOn( autoImmutable, 'connect' )
								.mockReturnValue( connection );
							const connectSpy = jest
								.spyOn( AutoImmutableModule, 'default' )
								.mockReturnValue( autoImmutable )
							const args = [ 'blatant', 'company', 'xylophone', 'yodellers', 'zenith' ];
							render(
								<Wrapper>
									<Client
										selectorMap={ selectorMapOnRender }
										resetPaths={ args }
									/>
								</Wrapper>
							);
							await wait(() => {});
							setSpy.mockClear();
							fireEvent.click( screen.getByRole( 'button' ) );
							expect( setSpy ).toHaveBeenCalledTimes( 1 );
							expect( setSpy.mock.calls[ 0 ][ 0 ] ).toEqual({
								[ AutoImmutableModule.DELETE_TAG ]: [
									'blatant', 'xylophone', 'yodellers', 'zenith'
								],
								company: {
									[ AutoImmutableModule.REPLACE_TAG ]: sourceData.company
								}
							});
							connectSpy.mockRestore();
							setSpy.mockRestore();
						} );
					} );
					describe( 'and called with NO  own property paths argument to reset', () => {
						test( 'calculates setstate changes using state slice matching property paths derived from the selectorMap', async () => {
							const sourceData = createSourceData();
							const autoImmutable = new AutoImmutable( sourceData );
							const connection = autoImmutable.connect();
							const setSpy = jest.spyOn( connection, 'set' );
							jest.spyOn( autoImmutable, 'connect' )
								.mockReturnValue( connection );
							const connectSpy = jest
								.spyOn( AutoImmutableModule, 'default' )
								.mockReturnValue( autoImmutable )
							render(
								<Wrapper>
									<Client selectorMap={ selectorMapOnRender } />
								</Wrapper>
							);
							await wait(() => {});
							setSpy.mockClear();
							fireEvent.click( screen.getByRole( 'button' ) );
							expect( setSpy ).toHaveBeenCalledTimes( 1 );
							expect( setSpy.mock.calls[ 0 ][ 0 ] ).toEqual({
								history: {
									places: {
									    2: {
									    	year: {
									    		[ AutoImmutableModule.REPLACE_TAG ]: sourceData.history.places[ 2 ].year,
									      	},
									    },
									},
								},
								isActive: {
									[ AutoImmutableModule.REPLACE_TAG ]: sourceData.isActive
								},
								tags: {
									5: {
										[ AutoImmutableModule.REPLACE_TAG ]: sourceData.tags[ 5 ]
									},
								},
							});
							connectSpy.mockRestore();
							setSpy.mockRestore();
						} );
					} );
				} );
				describe( 'when selectorMap is NOT present in the consumer', () => {
					describe( 'and called with own property paths arguments to reset', () => {
						test( 'resets with original slices and removes non-original slices for entries found in property paths', async () => {
							const args = [ 'blatant', 'company', 'xylophone', 'yodellers', 'zenith' ];
							const sourceData = createSourceData();
							const autoImmutable = new AutoImmutable( sourceData );
							const connection = autoImmutable.connect();
							const setSpy = jest.spyOn( connection, 'set' );
							jest
								.spyOn( autoImmutable, 'connect' )
								.mockReturnValue( connection );
							const connectSpy = jest
								.spyOn( AutoImmutableModule, 'default' )
								.mockReturnValue( autoImmutable );
							render( <Wrapper><Client resetPaths={ args } /></Wrapper> );
							await wait(() => {});
							setSpy.mockClear();
							fireEvent.click( screen.getByRole( 'button' ) );
							expect( setSpy ).toHaveBeenCalledTimes( 1 );
							expect( setSpy.mock.calls[ 0 ][ 0 ] ).toEqual({
								[ AutoImmutableModule.DELETE_TAG ]: [
									'blatant','xylophone','yodellers','zenith'
								],
								company: {
									[ AutoImmutableModule.REPLACE_TAG ]: sourceData.company
								},
							});
							setSpy.mockRestore();
							connectSpy.mockRestore();
						} );
					} );
					describe( 'and called with NO own property paths arguments to reset', () => {
						test( 'calculates setstate changes using no property paths -- the consumer applies no store reset [see usestore(...)]', async () => {
							const sourceData = createSourceData();
							const autoImmutable = new AutoImmutable( sourceData );
							const connection = autoImmutable.connect();
							const setSpy = jest.spyOn( connection, 'set' );
							jest.spyOn( autoImmutable, 'connect' )
								.mockReturnValue( connection );
							const connectSpy = jest
								.spyOn( AutoImmutableModule, 'default' )
								.mockReturnValue( autoImmutable )
							render( <Wrapper><Client /></Wrapper> );
							await wait(() => {});
							setSpy.mockClear();
							fireEvent.click( screen.getByRole( 'button' ) );
							expect( setSpy ).toHaveBeenCalledTimes( 1 );
							expect( setSpy.mock.calls[ 0 ][ 0 ] ).toEqual({});
							setSpy.mockRestore();
							connectSpy.mockRestore();
						} );
					} );
				} );
			} );
		} );
	} );
} );
