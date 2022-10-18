import React from 'react';
import axios from 'axios';
import { connect } from "react-redux";
import { selectors as mainSelectors, actions as mainActions } from "..";

class Friends extends React.Component
{
    constructor(props)
    {
        super(props);

        const sessionState = this.props.sessionState;
        this.state = {
            friends: sessionState.friends,
            friendRequests: sessionState.friendRequests,
        }
    }

    render()
    {
        const sessionState = this.props.sessionState;
        if (!sessionState.loggedIn)
        {
            return (
                <div
                    style={{
                        textAlign: "center",
                        marginTop: "15%"
                    }}
                >
                    Please login to access your friends
                </div>
            );
        }

        const friends = this.state.friends.map(friend => <li key={friend}>{friend}</li>);
        const friendRequests = this.state.friendRequests.map(friend => <li key={friend}>{friend}</li>);
        
        return (
            <div
                style={{
                    textAlign: 'center'
                }}
            >
                <div 
                    style={{
                        marginTop: "5%",
                        marginBottom: "5%",
                        display: "inline-block",
                        padding: "50px",
                        borderStyle: "solid",
                        borderRadius: "20px",
                        borderColor: '#3e444b'
                    }}
                >             
                    <div
                        style={{
                            borderStyle: "solid",
                            display: "inline-block",
                            marginBottom: "70px",
                            padding: "15px"
                        }}
                    >
                        <h1
                            style={{
                                textDecoration: "underline"
                            }}
                        >
                            Friend Requests
                        </h1>
                        <div
                            style={{
                                margin: "10px",
                                textAlign: 'left'
                            }}
                        >
                            {friendRequests.length !== 0 ? friendRequests : 'None yet'}
                        </div>
                    </div><br/>

                    <div
                        style={{
                            borderStyle: "solid",
                            display: "inline-block",
                            marginBottom: "70px",
                            padding: "15px"
                        }}
                    >
                        <h1
                            style={{
                                textDecoration: "underline"
                            }}
                        >
                            Friends
                        </h1>
                        <div
                            style={{
                                margin: "10px",
                                textAlign: 'left'
                            }}
                        >
                            {friends.length !== 0 ? friends : 'None yet'}
                        </div>
                    </div><br/>

                    <FriendForm
                        methods={this.props.methods}
                        setParentState={(data) => this.setState(data)}
                        sessionState={this.props.sessionState}
                    />
                </div>
            </div>
        );
    }
}

class FriendForm extends React.Component
{
    constructor(props)
    {
        super(props);
        this.state = {
            friendName: '',
            display: '',
            displayColor: 'white'
        };
        this.action = this.action.bind(this);
        this.changedFriendName = this.changedFriendName.bind(this);
    }

    async action(e, action)
    {
        e.preventDefault();
        const sessionState = this.props.sessionState;
        const sessionId = sessionState.sessionId;
        const userId = sessionState.userId;
        const friendUsername = this.state.friendName;

        const body = {sessionId, userId, friendUsername};

        // Call API /friends/add
        const res = await axios.post(process.env.REACT_APP_SERVER_URL + '/friends' + action, body);
        const success = res.data.success;
        console.log('Adding friend... ' + res.data.message);
        this.setState({
            display: res.data.message,
            displayColor: res.data.success ? 'white' : 'red'
        })
        if (!success)
        {
            return;
        }

        // Update the session state
        this.props.setSessionState(res.data.content);

        // Update the local state
        this.props.setParentState(res.data.content);
    }

    changedFriendName(e)
    {
        this.setState({friendName: e.target.value});
    }

    render()
    {
        return (            
            <div
                style={{
                    borderStyle: "solid",
                    display: "inline-block",
                    padding: "20px"
                }}
            >
                <h1
                    style={{
                        textDecoration: "underline"
                    }}
                >
                    Options
                </h1>

                <input
                    style={{
                        marginBottom: "-15px",
                        width: "90%",
                        marginLeft: "5%"
                    }}
                    className='form-control' 
                    value={this.state.friendName} 
                    onChange={this.changedFriendName}
                /><br/>

                <button 
                    style={{
                        width: "130px",
                        display: 'inline-block',
                        marginBottom: "10px",
                        borderRadius: '5px 0 0 5px'
                    }}
                    className='form-control' 
                    onClick={(e) => this.action(e, '/add')}
                >
                    Add Friend
                </button>

                <button 
                    style={{
                        width: "160px",
                        display: 'inline-block',
                        marginBottom: "10px",
                        borderRadius: "0 5px 5px 0"
                    }}
                    className='form-control' 
                    onClick={(e) => this.action(e, '/remove')}
                >
                    Remove Friend
                </button>

                <div
                    style={{
                        color: this.state.displayColor
                    }}
                >
                    {this.state.display}
                </div>
            </div>
        );
    }
}

const stateToProps = state => ({
    sessionState: mainSelectors.getSessionState(state)
});

const dispatchToProps = {
    setSessionState: mainActions.setSessionState
};

export default connect(stateToProps, dispatchToProps)(Friends);
