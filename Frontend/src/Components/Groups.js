import React from 'react';
import axios from 'axios';

export default class Groups extends React.Component
{
    constructor(props)
    {
        super(props);
        
        const sessionState = this.props.methods.getSessionState();
        this.state = {
            name: '',
            password: '',
            groups: sessionState.groups,
            members: [],
            expandedGroupIndex: -1
        };

        this.callGroups = this.callGroups.bind(this);
        this.getMembers = this.getMembers.bind(this);
    }

    async callGroups(e, action)
    {
        if (e !== undefined)
        {
            e.preventDefault();
        }

        const sessionState = this.props.methods.getSessionState();
        const sessionId = sessionState.sessionId;
        const userId = sessionState.userId;

        const name = this.state.name;
        const password = this.state.password;

        const body = {sessionState, sessionId, userId, name, password};

        const res = await axios.post(process.env.REACT_APP_SERVER_URL + '/groups/' + action, body);
        const success = res.data.success;
        console.log(res.data.message);
        if (!success)
        {
            return;
        }

        this.props.methods.setSessionState(res.data.content);
        this.setState(res.data.content);
    }

    async getMembers(name, index)
    {
        if (index === this.state.expandedGroupIndex)
        {
            this.setState({expandedGroupIndex: -1});
            return;
        }

        const sessionState = this.props.methods.getSessionState();
        const sessionId = sessionState.sessionId;
        const userId = sessionState.userId;

        const body = {sessionState, sessionId, userId, name};

        const res = await axios.post(process.env.REACT_APP_SERVER_URL + '/groups/getMembers', body);
        const success = res.data.success;
        console.log(res.data.message);
        if (!success)
        {
            return;
        }

        this.props.methods.setSessionState(res.data.content);
        this.setState(res.data.content);
        this.setState({expandedGroupIndex: index});
    }

    render()
    {
        if (!this.props.appState.loggedIn)
        {
            return (
                <div
                    style={{
                        textAlign: "center",
                        marginTop: "15%"
                    }}
                >
                    Please login to access this page
                </div>
            );
        }
        
        const membersElement = this.state.members.map(member => <li key={member}>{member}</li>)
        const groupElements = [];
        for (var i = 0; i < this.state.groups.length; i++)
        {
            const group = this.state.groups[i];
            const index = i;
            const groupElement = (
                <div key={group} >                    
                    <h5 onClick={() => this.getMembers(group, index)} style={{cursor: "pointer"}} className="simpleClickable">
                        {group}
                    </h5>
                    <div>
                        {this.state.expandedGroupIndex === index ? membersElement : []}
                    </div>

                </div>
            );

            groupElements.push(groupElement);
        }

        return (
            <div style={{textAlign: "center"}}>
                <div>
                    <h1>Your groups</h1>
                    {groupElements.map(groupElement => groupElement)}
                </div>
                <form>
                    <div style={{marginBottom: "20px", marginTop: "30px"}}>
                        Name<br/>
                        <input type='text' onChange={(e) => this.setState({name: e.target.value})} value={this.state.name}/>
                    </div>
                    <div style={{marginBottom: "30px"}}>
                        Password<br/>
                        <input type='password' onChange={(e) => this.setState({password: e.target.value})} value={this.state.password}/>
                    </div>
                    <div style={{marginBottom: "30px"}}>
                        <input type='submit' onClick={(e) => this.callGroups(e, 'join')} value='Join'/>
                        <input type='submit' onClick={(e) => this.callGroups(e, 'create')} value='Create'/>
                        <input type='submit' onClick={(e) => this.callGroups(e, 'leave')} value='Leave'/>
                    </div>
                </form>
            </div>
        );
    }
}
