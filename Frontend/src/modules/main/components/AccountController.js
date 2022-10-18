import React from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { connect } from "react-redux";
import { actions as mainActions, selectors as mainSelectors } from "..";

class AccountController extends React.Component
{
    constructor(props)
    {
        super(props);
        
        this.logoff = this.logoff.bind(this);
    }

    async logoff()
    {
        const sessionState = this.props.sessionState;
        const userId = sessionState.userId;
        const sessionId = sessionState.sessionId;

        const res = await axios.post(process.env.REACT_APP_SERVER_URL + '/users/logoff', {userId, sessionId});
        console.log('Logging off... ' + res.data.message);

        // Update the session
        this.props.clearSessionState();
    }

    render()
    {
        const sessionState = this.props.sessionState;
        const username = sessionState.username;

        const loggedIn = this.props.appState.loggedIn;

        return (
            <div style={{fontSize: "18px"}}>
                <SessionClock
                    loggedIn={loggedIn}
                    sessionState={this.props.sessionState}
                    setSessionState={this.props.setSessionState}
                    clearSessionState={this.props.clearSessionState}
                />
                <div style={{color: "white", display: "inline-block", marginRight: "10px"}}>
                    {username}
                </div>
                <LogButton logoff={this.logoff} loggedIn={loggedIn} style={{width: "auto"}}/>
            </div>
        );
    }
}

class LogButton extends React.Component
{
    render()
    {
        if (!this.props.loggedIn)
        {
            return (
                <Link to='/login'>Register / Login</Link>
            );
        }

        return (
            <Link onClick={this.props.logoff} to='/'>Logoff</Link>
        );
    }
}

class SessionClock extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            timestamp: new Date(),
            sessionTimestamp: undefined
        }

        this.tick = this.tick.bind(this);
        this.updateSessionFromAPI = this.updateSessionFromAPI.bind(this);
        this.isValidSession = this.isValidSession.bind(this);
    }

    componentDidMount()
    {
        this.timerId = setInterval(this.tick, 1000);
        this.pollAPIId = setInterval(async () => { 
            await this.updateSessionFromAPI();
            if (!(await this.isValidSession())) {
                this.props.clearSessionState();
            }
        }, 1000 * process.env.REACT_APP_API_POLL_INTERVAL_S)
    }
    componentWillUnmount()
    {
        clearInterval(this.timerId);
    }

    tick()
    {
        if (!this.props.loggedIn)
        {
            return;
        }

        this.setState({
            timestamp: new Date(),
            sessionTimestamp: this.props.sessionState.sessionTimestamp 
        });
    }

    async updateSessionFromAPI()
    {
        // Prepare the body of the call
        const body = {sessionId: this.props.sessionState.sessionId, userId: this.props.sessionState.userId};

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
        this.props.setSessionState(data);
    }

    async isValidSession()
    {
        const sessionId = this.props.sessionState.sessionId;
        const userId = this.props.sessionState.userId;

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

    render()
    {
        if (!this.props.loggedIn)
        {
            return (
                <div>
                </div>
            );
        }

        const timestamp = this.state.timestamp.getTime();
        const sessionTimestamp = new Date(this.state.sessionTimestamp);

        const timeDifference_ms = timestamp - sessionTimestamp;
        const timeDifference_s = timeDifference_ms / 1000;
        
        const SESSION_TIMEOUT_S = process.env.REACT_APP_SESSION_TIMEOUT_S;
        const timeTilTimout_s = SESSION_TIMEOUT_S - timeDifference_s;

        let formattedTimeTilTimout_s = Math.floor(timeTilTimout_s) ? Math.floor(timeTilTimout_s) : 'Loading...';
        formattedTimeTilTimout_s = formattedTimeTilTimout_s < 0 ? 0 : formattedTimeTilTimout_s;
        
        return (
            <div
                style={{
                    display: "inline-block",
                    marginRight: "60px"
                }}
            >
                Session Timeout in: {formattedTimeTilTimout_s} seconds
            </div>
        );
    }
}

const stateToProps = state => ({
    appState: mainSelectors.getAppState(state),
    sessionState: mainSelectors.getSessionState(state)
});

const dispatchToProps = {
    setAppState: mainActions.setAppState,
    setSessionState: mainActions.setSessionState,
    clearSessionState: mainActions.clearSessionState
};

export default connect(stateToProps, dispatchToProps)(AccountController);
