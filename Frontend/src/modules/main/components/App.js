import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Register from './Register';
import Navbar from './Navbar';
import Home from './Home';
import UserList from './UserList';
import Login from './Login';
import AdminPanel from './AdminPanel';
import Availabilities from './Availabilities';
import Friends from './Friends';
import Groups from './Groups';
import RegisterApp from './RegisterApp';

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

class App extends React.Component 
{
	constructor(props)
	{
		super(props);
		this.state = {
			_isMounted: false,
			loggedIn: false
		};

		this.setAppState = this.setAppState.bind(this);
		this.setSessionState = this.setSessionState.bind(this);
		this.getSessionState = this.getSessionState.bind(this);
		this.clearSessionState = this.clearSessionState.bind(this);
	}

	componentDidMount()
	{
		this.mountTimerId = setInterval(() => {
			const session = this.props.sessionRef.current;
			if (session !== null)
			{
				this.setState({
					_isMounted: session.state._isMounted,
					loggedIn: session.state.loggedIn
				});
				
				if (this.state._isMounted)
				{
					clearInterval(this.mountTimerId);
				}
			}
		}, 100);

		this.pollSessionTimerId = setInterval(() => {
			const session = this.props.sessionRef.current;
			if (session.state.loggedIn !== this.state.loggedIn)
			{
				this.setState(session.state);
				alert('Your session has expired. Please log back in');
			}
		}, process.env.REACT_APP_SESSION_POLL_INTERVAL_S * 1000)
	}

	componentWillUnmount()
	{
		console.log(' home')
		clearInterval(this.mountTimerId);
		clearInterval(this.pollSessionTimerId);	
	}

	setAppState(data)
	{
		this.setState(data);
	}

	setSessionState(data)
	{
		const session = this.props.sessionRef.current;
		session.updateSession(data);
	}

	clearSessionState()
	{
		const session = this.props.sessionRef.current;
		session.clearSession();
	}

	getSessionState()
	{
		const session = this.props.sessionRef.current;
		return session.state;
	}

	render()
	{
		if (!this.state._isMounted)
		{
			return (
				<div>					
					Connecting to backend.. backend might be down if this takes more than 15 seconds. Contact Oussama
				</div>
			);
		}

		const methods = {
			clearSessionState: this.clearSessionState
		};

		const appState = {
			_isMounted: this.state._isMounted,
			loggedIn: this.state.loggedIn
		}
		
		return (
			<div className='main'>
				<Router>
					<Navbar methods={methods} appState={appState}/><br/>
					<Route path="/" exact component={Home}/>
					<Route path="/login" component={() => <Login methods={methods} appState={appState}/>}/>
					<Route path="/register" component={() => <Register methods={methods} appState={appState}/>}/>				
					<Route path="/admin" component={AdminPanel}/>		
					<Route path="/userList" component={UserList}/>
					<Route path="/friends" component={() => <Friends methods={methods} appState={appState}/>}/>
					<Route path="/availabilities" component={() => <Availabilities methods={methods} appState={appState}/>}/>
					<Route path="/groups" component={() => <Groups methods={methods} appState={appState}/>}/>
					<Route path="/otherApps" component={() => <RegisterApp methods={methods} appState={appState}/>}/>
				</Router>
			</div>
		);
	}
}
	
export default App;
	