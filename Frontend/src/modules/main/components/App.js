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
	render()
	{		
		return (
			<div className='main'>
				<Router>
					<Navbar/><br/>
					<Route path="/" exact component={Home}/>
					<Route path="/login" component={Login}/>
					<Route path="/register" component={Register}/>				
					<Route path="/admin" component={AdminPanel}/>		
					<Route path="/userList" component={UserList}/>
					<Route path="/friends" component={Friends}/>
					<Route path="/availabilities" component={Availabilities}/>
					<Route path="/groups" component={Groups}/>
					<Route path="/otherApps" component={RegisterApp}/>
				</Router>
			</div>
		);
	}
}
	
export default App;
	