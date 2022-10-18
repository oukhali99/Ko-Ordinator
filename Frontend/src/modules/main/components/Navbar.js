import React from 'react';
import { Link } from 'react-router-dom';
import AccountController from './AccountController';

class Navbar extends React.Component 
{
    render()
    {
        return (
            <nav className="navbar navbar-dark bg-dark navbar-expand-lg">
                <Link to="/" className="navbar-brand">Home</Link>
                <div className="collpase navbar-collapse">
                    <ul className="navbar-nav mr-auto">
                        <li className="navbar-item">
                            <Link to="/availabilities" className="nav-link">Schedule</Link>
                        </li>
                        <li className="navbar-item">
                            <Link to="/userList" className="nav-link">User List</Link>
                        </li>
                        <li className="navbar-item" style={{display: "inline-block"}}>
                            <Link to="/friends" className="nav-link">Friends</Link>
                        </li>
                        <li className="navbar-item">
                            <Link to="/groups" className="nav-link">Groups</Link>
                        </li>
                        <li className="navbar-item">
                            <Link to="/otherApps" className="nav-link">RegisterApp</Link>
                        </li>
                    </ul>
                </div>
                <AccountController methods={this.props.methods}/>
            </nav>
            );
        }
    }
    
export default Navbar;
    