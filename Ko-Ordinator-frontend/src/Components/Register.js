import React from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

class Register extends React.Component 
{
    constructor(props)
    {
        super(props);
        this.state = {
            email: '',
            username: '',
            password: '',
            retypePassword: '',
            display: ''
        };

        this.register = this.register.bind(this);
        this.changeUsernameHandler = this.changeUsernameHandler.bind(this);
        this.changePasswordHandler = this.changePasswordHandler.bind(this);
        this.changeRetypePasswordHandler = this.changeRetypePasswordHandler.bind(this);        
    }

	async register(e)
	{
        e.preventDefault();
        this.setState({display: ''});

        const email = this.state.email;
        const username = this.state.username;
        const password = this.state.password;
        const retypePassword = this.state.retypePassword;

        if (password !== retypePassword)
        {
            this.setState({display: 'Passwords do not match'});
            return;
        }

        const newUser = {
            username,
            password,
            email
        }

        const res = await axios.post(process.env.REACT_APP_SERVER_URL + '/users/register', newUser);
        const success = res.data.success;
        const message = res.data.message;
        this.setState({display: message});
        console.log('Registering user... ' + message);
        if (!success)
        {
            return;
        }
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
            password: e.target.value,
            retypePassword: e.target.value
        });
    }

    changeRetypePasswordHandler(e)
    {
        this.setState({
            retypePassword: e.target.value
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
                        marginTop: "20%"
                    }}
                >
                    Please <b style={{color: "green"}}>logoff</b> to access this page
                </div>
            );
        }

		return (
			<form className="form-group" style={{marginLeft: "30%", marginRight: "30%", marginTop: "10%"}} name="Sign Up">
                <div style={{marginBottom: "30px"}}>
                    <label>E-Mail</label>
                    <input className="form-control" value={this.state.email} onChange={(e) => this.setState({email: e.target.value})} type="text"/>
                </div>
                <div style={{marginBottom: "30px"}}>
                    <label>Username</label>
                    <input className="form-control" value={this.state.username} onChange={this.changeUsernameHandler} type="text"/>
                </div>
                <div style={{marginBottom: "30px"}}>
                    <label>Password</label>
                    <input className="form-control" value={this.state.password} onChange={this.changePasswordHandler} type="password"/>    
                </div>
                
                <div style={{textAlign: "right"}}>
                    <button 
                        onClick={this.register}
                        className='form-control' 
                        value="Register" 
                        type="submit" 
                        style={{
                            display: "inline-block",
                            marginRight: "10px",
                            width: "100px",
                            marginBottom: "10px"
                        }}
                    >
                        Register
                    </button>
                </div>
                Already have an account? <Link to='/login'>Login here</Link>
                <div style={{textAlign: "center", color: "red"}}>
                    {this.state.display}
                </div>
			</form>
		);
	}
}
	
export default Register;
	