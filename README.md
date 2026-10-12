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
	<img alt="NPM" src="https://img.shields.io/npm/l/@webkrafters/react-observable-context">
	<img alt="Maintenance" src="https://img.shields.io/maintenance/yes/2032">
	<img alt="build size" src="https://img.shields.io/bundlephobia/minzip/@webkrafters/react-observable-context?label=bundle%20size">
	<a href="https://www.npmjs.com/package/@webKrafters/react-observable-context">
		<img alt="Downloads" src="https://img.shields.io/npm/dt/@webkrafters/react-observable-context.svg">
	</a>
	<img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/webKrafters/react-observable-context.js">
</p>

# React-Observable-Context [Eagle Eye]

<table BORDER-COLOR="0a0" BORDER-WIDTH="2">
    <td VALIGN="middle" ALIGN="center" FONT-WEIGHT="BOLD" COLOR="#333" HEIGHT="250px" width="1250px">
		COMPATIBLE WITH REACT VERSIONS 16.8 to 18.x.x.<br />
		FOR REACT 19.2.0 AND ABOVE, PLEASE USE THE <br />
		<a href="https://www.npmjs.com/package/@webkrafters/react-eagleeye">React Eagle Eye</a>
	</td>
</table>

<ul>
	<li> Ready for use anywhere in the app. No Provider components needed.</li>
	<li> Automatically prevents unnecessary cascading re-renders when used with the <a href="https://react-observable-context.js.org/getting-started/#connect-usage"><code>connect</code></a> Stream API.</li>
	<li> Auto-immutable update-friendly context. See <a href="https://react-observable-context.js.org/concepts/store/setstate"><code>store.setState</code></a>.</li>
	<li> A context bearing an observable consumer <a href="https://react-observable-context.js.org/concepts/store">store</a>.</li>
	<li> Recognizes <b>negative array indexing</b>. Please see <a href="https://react-observable-context.js.org/concepts/property-path">Property Path</a> and <code>store.setState</code> <a href="https://react-observable-context.js.org/concepts/store/setstate#indexing">Indexing</a>.</li>
	<li> Only re-renders subscribing components (<a href="https://react-observable-context.js.org/concepts/client">clients</a>) on context state changes.</li>
	<li> Subscribing component decides which context state properties' changes to trigger its update.</li>
	<li>OOB Support for framework-agnostic state sharing among applications. Simply create an <a href="https://auto-immutable.js.org/intro/">Auto Immutable</a> instance to pass around as the <code>value</code> argument for this or any <a href="https://eagleeye.js.org">Eagle Eye</a> based state manager instances.</li>
</ul>

**Name:** React-Observable-Context

**Moniker:** Legacy Eagle Eye

**Usage:** Please see <b><a href="https://react-observable-context.js.org/getting-started">Getting Started</a></b>.

**Demo:**\
[1] [Play with the app on codesandbox](https://codesandbox.io/s/github/webKrafters/react-observable-context-app)\
[2] [Play with the app on codesandbox (Universal Rendering)](https://codesandbox.io/s/github/webKrafters/roc-universal-app)\
If sandbox fails to load app, please refresh dependencies on its lower left.\
**OR**\
Bring in and run the demo software locally through the following steps:\
**Step 1:** Run either\
&nbsp;&nbsp;&nbsp;&nbsp;`git clone https://github.com/webKrafters/react-observable-context-app.git`\
&nbsp;&nbsp;&nbsp;&nbsp;or\
&nbsp;&nbsp;&nbsp;&nbsp;`git clone https://github.com/webKrafters/roc-universal-app.git` (Universal Rendering)\
**Step 2:** CD into the cloned directory\
**Step 3:** Run `npm i`\
**Step 4:** Run `npm run dev`\
**Step 5:** Copy and paste the displayed URL into the web browser.\
**Step 6:** Use CTRL+F5 (Mac: CMD+F5) at the browser to ensure a fresh page load if needed.\
**Step 7:** Pay with the app.

**Install:**\
npm install --save @webkrafters/react-observable-context

May also see <b><a href="https://react-observable-context.js.org/history/features">What's Changed?</a></b>

Full Documentation: **[react-observable-context.js.org](https://react-observable-context.js.org)**

# License

GPLv3
