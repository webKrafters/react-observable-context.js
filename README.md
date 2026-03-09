<p align="center">
	<img alt="Eagle Eye" height="150px" src="logo.png" width="250px" />
</p>
<p align="center">
	<a href="https://typescriptlang.org">
		<img alt="TypeScript" src="https://badgen.net/badge/icon/typescript?icon=typescript&label">
	</a>
	<a href="https://github.com/webKrafters/react-observable-context.js/actions">
		<img alt="GitHub Workflow Status" src="https://img.shields.io/github/actions/workflow/status/webKrafters/react-observable-context.js/test.yml">
	</a>
	<a href="https://coveralls.io/github/webKrafters/react-observable-context.js">
		<img alt="coverage" src="https://img.shields.io/coverallsCoverage/github/webKrafters/react-observable-context.js.svg">
	</a>
	<img alt="NPM" src="https://img.shields.io/npm/l/@webkrafters/react-observable-context.js">
	<img alt="Maintenance" src="https://img.shields.io/maintenance/yes/2032">
	<img alt="build size" src="https://img.shields.io/bundlephobia/minzip/@webkrafters/react-observable-context.js?label=bundle%20size">
	<a href="https://www.npmjs.com/package/@webKrafters/react-observable-context.js">
		<img alt="Downloads" src="https://img.shields.io/npm/dt/@webkrafters/react-observable-context.js.svg">
	</a>
	<img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/webKrafters/react-observable-context.js">
</p>

# React-Observable-Context [Eagle Eye]

<table BORDER-COLOR="0a0" BORDER-WIDTH="2">
    <td VALIGN="middle" ALIGN="center" FONT-WEIGHT="BOLD" COLOR="#333" HEIGHT="250px" width="1250px">
		COMPATIBLE WITH REACT VERSIONS 16.8 to 18.x.x.<br />
		A NEW EAGLEEYE BASED PRODUCT WILL BE DEVELOPED SPECIFICALLY FOR REACT 19+<br /><br />
		PLEASE STAY TUNED.
	</td>
</table>

<ul>
	<li> Ready for use anywhere in the app. No Provider components needed.</li>
	<li> Auto-immutable update-friendly context. See <a href="https://react-observable-context.js.org/concepts/store/setstate"><code>store.setState</code></a>.</li>
	<li> A context bearing an observable consumer <a href="https://react-observable-context.js.org/concepts/store">store</a>.</li>
	<li> Recognizes <b>negative array indexing</b>. Please see <a href="https://react-observable-context.js.org/concepts/property-path">Property Path</a> and <code>store.setState</code> <a href="https://react-observable-context.js.org/concepts/store/setstate#indexing">Indexing</a>.</li>
	<li> Only re-renders subscribing components (<a href="https://react-observable-context.js.org/concepts/client">clients</a>) on context state changes.</li>
	<li> Subscribing component decides which context state properties' changes to trigger its update.</li>
</ul>

**Name:** React-Observable-Context

**Moniker:** Legacy Eagle Eye

**Usage:** Please see <b><a href="https://react-observable-context.js.org/getting-started">Getting Started</a></b>.

**Demo:** [Play with the app on codesandbox](https://codesandbox.io/s/github/webKrafters/react-observable-context-app)\
If sandbox fails to load app, please refresh dependencies on its lower left.

**Install:**\
npm install --save @webkrafters/react-observable-context\

## Usage:

```tsx
import { FC } from 'react';
import { createEagleEye } from '@webkrafters/react-observable-context';

const context = createEagleEye(
	T|AutoImmutable<T>?,
	Prehooks<T>?,
	IStorage<T>?
);

// component consuming change stream manually
const useStream = context.useStream;
const Component1 : FC = () => {
	const {
		data,
		resetState,
		setState
	} = useStream( SelectorMap );
	...
};

// components consuming change stream through a reusable adapter
const connect = context.connect( SelectorMap? );
const Component2 = connect(({ data, resetState, setState, ...ownProps }) => {...});
const Component3 = connect(({ data, resetState, setState, ...ownProps }) => {...});

const App : FC = () => (
	<>
		<Component1 />
		<Component2 />
		<Component3 />
	</>
);

```

### Releasing context resources.
```tsx
context.dispose();
```
Deactivates this context by:
<ol>
	<li>unsubscribing all observers to it</li>
	<li>severing connections to data stores</li>
	<li>unsetting all resources</li>
</ol>

### Accessing external store reference.
```tsx
const store = context.store;
// https://react-observable-context.js.org/external-access#external-apis
store.resetState( Array<string>? );
// https://react-observable-context.js.org/external-access#external-apis
store.setState( Changes<T> );
// https://react-observable-context.js.org/external-access#external-apis
const state = store.getState( Array<string> );
// https://react-observable-context.js.org/external-access#external-apis
const unsubscribeFn = store.subscribe( eventType, listener );
```
Any actions taken here is applied to all components streaming affected state slices.\
Caveat 1: Parameterless <code>context.store.getState</code> returns the whole state.\
Caveat 2: Parameterless <code>context.store.resetState</code> is a no-op.

### Joining the context stream.
A context stream allows a client to set up a dedicated channel through which it receives automatic updates whenever its selected slices of state change. It can also update the context through this channel.
```tsx
const useStream = context.stream;
// joining the stream twice
// for more on selectorMap - https://react-observable-context.js.org/concepts/selector-map/
const store1 = useStream(SelectorMap?);
const store2 = useStream(SelectorMap?);
// access the current data value monitored by this store
console.log( 'data', store1.data );
// https://react-observable-context.js.org/concepts/store/resetstate/
store1.resetState( Array<string>? ); // changes are context-wide
// https://react-observable-context.js.org/concepts/store/setstate/
store1.setState( Changes<T> ); // changes are context-wide
```
Any actions taken here is applied to all components streaming affected state slices.\
Caveat 1: Parameterless <code>store.resetState</code> resets state slices consumed by this store.\
Caveat 2: Parameterless <code>store.resetState</code> for stores not consuming state is a no-op.

### Accessing underlying cache.
```tsx
const cache = context.cache;
```

### Accessing `close` status.
```tsx
const closed = context.closed;
```

### Accessing current state update `prehooks`.
```tsx
const prehooks = context.prehooks;
```

### Updating state update `prehooks`.
```tsx
context.prehooks = Prehooks<T>?;
```

### Accessing context `storage`.
```tsx
const storage = context.storage;
```

### Updating context `storage`.
```tsx
context.storage = IStorage<T>?;
```

May also see <b><a href="https://react-observable-context.js.org/history/features">What's Changed?</a></b>

**[react-observable-context.js.org](https://react-observable-context.js.org)**

# License

GPLv3
