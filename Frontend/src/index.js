import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { App } from './modules/main';
import * as serviceWorker from './serviceWorker';
import Session from './modules/main/components/Session';
import store from "./store";
import { Provider } from "react-redux";

const sessionRef = React.createRef();
const session = <Session ref={sessionRef} showSession={false} pollAPI={true} /> // pollAPI cannot accurately tell us if the user's session has expired

ReactDOM.render(
	<React.StrictMode>
		<Provider store={store}>
			<App sessionRef={sessionRef} />
		</Provider>
	</React.StrictMode>,
	document.getElementById('root')
);
ReactDOM.render(
	session,
	document.getElementById('session')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
