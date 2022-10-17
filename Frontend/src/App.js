import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Register from './main/components/Register';
import Navbar from './main/components/Navbar';
import Home from './main/components/Home';
import UserList from './main/components/UserList';
import Login from './main/components/Login';
import AdminPanel from './main/components/AdminPanel';
import Availabilities from './main/components/Availabilities';
import Friends from './main/components/Friends';
import Groups from './main/components/Groups';
import RegisterApp from './main/components/RegisterApp';

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
			setAppState: this.setAppState,
			setSessionState: this.setSessionState,
			clearSessionState: this.clearSessionState,
			getSessionState: this.getSessionState
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
	