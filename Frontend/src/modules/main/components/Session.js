// DEPRECATED FILE

import React from 'react';
import axios from 'axios';

class Session extends React.Component 
{
    constructor(props)
    {
        super(props);
        this.state = {
            _isMounted: false,
            pollAPI: this.props.pollAPI,

            loggedIn: false,
            username: '',
            sessionId: '',
            userId: '',
            availabilities: [],
            friends: [],
            friendRequests: [],
            groups: [],
            sessionTimestamp: undefined
        }

        this.updateSession = this.updateSession.bind(this);
        this.clearSession = this.clearSession.bind(this);
        this.updateSessionFromAPI = this.updateSessionFromAPI.bind(this);
        this.isValidSession = this.isValidSession.bind(this);
    }

    async componentDidMount()
    {
        if (!(await this.isValidSession))
        {
            this.clearSession();
        }

        // Get our information from the API
        await this.updateSessionFromAPI();
        this.setState({_isMounted: true});

        // Poll API
        if (this.state.pollAPI)
        {
            this.timerId = setInterval(() => {
                if (this.state.loggedIn)
                {
                    this.updateSessionFromAPI();
                }
            }, process.env.REACT_APP_API_POLL_INTERVAL_S * 1000);
        }
    }

    componentWillUnmount()
    {
        if (this.state.pollAPI)
        {
            clearInterval(this.timerId);
        }
    }

    async isValidSession()
    {
        const sessionId = sessionStorage.getItem('sessionId');
        const userId = sessionStorage.getItem('userId');

        // Validate the inputs
        if (sessionId === undefined || sessionId === '' || userId === undefined || userId === '')
        {
            console.log('No session found in sessionStorage');
            return false;
        }

        const res = await axios.post(process.env.REACT_APP_SERVER_URL + '/users/isUserSessionValid', { sessionId, userId });
        const success = res.data.success;
        const message = res.data.message;
        console.log('Validating session... ' + message);
        if (!success)
        {
            return false;
        }
        return res.data.content.valid;
    }

    clearSession()
    {
        console.log('Clearing session');
        this.setState({
            loggedIn: false,
            username: '',
            sessionId: '',
            userId: '',
            availabilities: [],
            friends: [],
            friendRequests: [],
            groups: [],
            sessionTimestamp: undefined
        });
        sessionStorage.clear();
    }

    updateSession(data)
    {
        const {userId, sessionId, loggedIn} = data;

        // Update the local state
        this.setState(data);
        
        // Update the sessionStorage        
        if (userId !== undefined)
        {
            sessionStorage.setItem('userId', userId);
        }

        if (sessionId !== undefined)
        {
            sessionStorage.setItem('sessionId', sessionId);
        }

        if (loggedIn !== undefined)
        {
            sessionStorage.setItem('loggedIn', loggedIn);
        }
    }
    
    async updateSessionFromAPI()
    {
        // Prepare the body of the call
        const body = {sessionId: sessionStorage.getItem('sessionId'), userId: sessionStorage.getItem('userId')};

        // Do the call
        const res = await axios.post(process.env.REACT_APP_SERVER_URL + '/users/getUserDocument', body);
        
        // Check if failed the call
        if (!res.data.success)
        {
            console.log('Updating session from API... ' + res.data.message);
            return;
        }

        // Get the call data
        const data = res.data.content;

        // Set the states to reflect the fact that you are logged in
        this.updateSession(data);
    }

	render()
	{        
		return (			
            <div>
                {this.props.showSession ? JSON.stringify(this.state) : ''}
            </div>
		);
	}
}
	
export default Session;
