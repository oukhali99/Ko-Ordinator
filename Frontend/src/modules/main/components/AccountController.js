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

        // Update appState
        this.props.setAppState({loggedIn: false});
    }

    render()
    {
        const sessionState = this.props.sessionState;
        const username = sessionState.username;

        const loggedIn = this.props.appState.loggedIn;

        return (
            <div style={{fontSize: "18px"}}>
                <SessionClock loggedIn={loggedIn} sessionState={this.props.sessionState}/>
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
    }

    componentDidMount()
    {
        this.timerId = setInterval(this.tick, 1000);
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

        const sessionState = this.props.sessionState;
        this.setState({
            timestamp: new Date(),
            sessionTimestamp: sessionState.sessionTimestamp
        });
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
    clearSessionState: mainActions.clearSessionState
};

export default connect(stateToProps, dispatchToProps)(AccountController);
