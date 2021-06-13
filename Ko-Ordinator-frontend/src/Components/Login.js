import React from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

class Login extends React.Component
{
    constructor(props)
    {
        super(props);
        this.state = {username: '', password: '', display: '', email: ''};
        
        this.login = this.login.bind(this);
        this.changeUsernameHandler = this.changeUsernameHandler.bind(this);
        this.changePasswordHandler = this.changePasswordHandler.bind(this);
    }

    async login(e)
	{
        this.setState({display: ''});
        e.preventDefault();
        
        // Check if you are already logged in
        if (this.props.appState.loggedIn)
        {
            this.setState({display: 'You are already logged in'});
            return;
        }
        
        // Call the login API call
        const username = this.state.username;
        const password = this.state.password;
        const email = this.state.email;
        const user = {username, password, email};
        const res = await axios.post(process.env.REACT_APP_SERVER_URL + '/users/login', user);
        const success = res.data.success;
        console.log('Calling /login... ' + res.data.message);
        this.setState({display: res.data.message});
        if (!success)
        {
            return;
        }

        // Update the session
        this.props.methods.setSessionState(res.data.content);

        // Update appState
        this.props.methods.setAppState({loggedIn: true});
    }
    
    changeUsernameHandler(e)
    {
        this.setState({
            username: e.target.value
        });
    }

    changePasswordHandler(e)
    {
        this.setState({
            password: e.target.value
        });
    }

    render()
    {
        if (this.props.appState.loggedIn)
        {
            return (
                <div
                    style={{
                        textAlign: "center",
                        marginTop: "15%"
                    }}
                >
                    You are now logged in!<br/>
                    <Link to='/'>Click here to proceed</Link>
                </div>
            );
        }
        
        return (
            <div style={{marginLeft: "30%", marginRight: "30%", marginTop: "10%"}}>
                <form className="form-group" onSubmit={this.login}>
                    <div style={{marginBottom: "30px"}}>
                        <label>E-Mail</label>
                        <input className='form-control' value={this.state.email} onChange={(e) => this.setState({email: e.target.value})}/>  
                    </div> 
                    <div style={{marginBottom: "30px"}}>
                        <label>Username</label>
                        <input className='form-control' value={this.state.username} onChange={this.changeUsernameHandler}/>  
                    </div>                  
                    <div style={{marginBottom: "30px"}}>
                        <label>Password</label>
                        <input className='form-control' value={this.state.password} onChange={this.changePasswordHandler} type="password"/>
                    </div>

                    <div 
                        style={{
                            textAlign: "right"
                        }}
                    >
                        <button 
                            className='form-control' 
                            onClick={this.login} 
                            style={{
                                display: "inline-block", 
                                marginRight: "10px", 
                                marginBottom: "10px", 
                                width: "80px"
                            }}
                        >
                            Login
                        </button>
                    </div>
                    Don't have an account yet? <Link to='/register' style={{}}>Create one for free</Link>
                    <div style={{textAlign: "center", color: "red"}}>
                        {this.state.display}
                    </div>
                </form>
            </div>
        );
    }
}

export default Login;
