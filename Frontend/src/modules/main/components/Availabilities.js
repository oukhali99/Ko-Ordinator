import React from 'react';
import axios from 'axios';
import { connect } from "react-redux";
import { selectors as mainSelectors } from "..";

const WEEKDAY_NAMES_LIST = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const highLightedColor = '#acab6e';

class HoursColumn extends React.Component
{
    render()
    {
        const highlightedHour = this.props.highlightedHour;
        let hours = [<div key="ground" style={{borderStyle: "solid", height: "30px", textAlign: "center"}}>Hour</div>];

        for (var i = 0; i < 24; i++)
        {
            const backgroundColor = highlightedHour === i ? highLightedColor : '';
            hours.push(
                <div 
                    key={i} 
                    style={{
                        borderStyle: "solid", 
                        height: "30px", 
                        textAlign: "center", 
                        backgroundColor,
                        transition: 'background-color 0.1s'
                    }}
                >
                    {(i < 10 ? '0'+i : i) + ':00'}
                </div>
            );
        }

        return (
            <div>
                {hours}
            </div>
        );
    }
}

class DayColumn extends React.Component
{
    render()
    {
        let weekdays = [
            <div
                key="ground" 
                style={{
                    borderStyle: "solid",
                    height: "30px",
                    textAlign: "center",
                    backgroundColor: this.props.highlightedWeekday === this.props.weekday ? highLightedColor : '',
                    transition: 'background-color 0.2s'
                }}
            >
                {WEEKDAY_NAMES_LIST[this.props.weekday]}
            </div>
            ];

        for (var i = 0; i < 24; i++)
        {
            weekdays.push(
                <HourCell
                    highlightHour={this.props.highlightHour}
                    highlightWeekday={this.props.highlightWeekday}
                    matchMode={this.props.matchMode} 
                    friendAvailabilities={this.props.friendAvailabilities} 
                    groupAvailabilities={this.props.groupAvailabilities} 
                    methods={this.props.methods} key={this.props.weekday + '' + i} 
                    hour={i} weekday={this.props.weekday}
                />
            );
        }

        return (
            <div>
                {weekdays}
            </div>
        );
    }
}

class HourCell extends React.Component
{
    constructor(props)
    {
        super(props);

        this.highLightedColor = '#4b4b3e';

        const sessionState = this.props.methods.getSessionState();
        this.state = {
            availabilities: sessionState.availabilities,
            backgroundColor: ''
        };

        this.onClick = this.onClick.bind(this);
        this.mouseEnterHandler = this.mouseEnterHandler.bind(this);
        this.mouseLeaveHandler = this.mouseLeaveHandler.bind(this);
    }

    async onClick()
    {
        const sessionState = this.props.methods.getSessionState();
        const sessionId = sessionState.sessionId;
        const userId = sessionState.userId;
        
        const availabilities = this.state.availabilities;

        const hour = this.props.hour;
        const weekday = this.props.weekday;

        const body = {weekday, hour, userId, sessionId};
        
        // Does the availability already exist? Add it or remove it?
        const available = availabilities.some(availability => availability.hour === hour && availability.weekday === weekday);
        const action = !available ? 'add' : 'remove';

        // Make the call
        const res = await axios.post(process.env.REACT_APP_SERVER_URL + '/availabilities/' + action, body);
        const success = res.data.success;
        console.log(res.data.message);
        if (!success)
        {
            return;
        }

        // Update the session with the new data
        this.props.methods.setSessionState(res.data.content);

        // Set the local state
        this.setState(res.data.content);
    }

    mouseEnterHandler()
    {
        this.props.highlightHour(this.props.hour); 
        this.props.highlightWeekday(this.props.weekday);
        //this.setState({backgroundColor: this.highLightedColor})
    }
    mouseLeaveHandler()
    {
        this.props.highlightHour(this.props.hour); 
        this.props.highlightWeekday(this.props.weekday);
        this.setState({backgroundColor: ''})
    }

    render()
    {
        const weekday = this.props.weekday;
        const hour = this.props.hour;        
        const availabilities = this.state.availabilities;

        const userIsAvailable = availabilities.some(availability => availability.hour === hour && availability.weekday === weekday);
        
        let onClick = this.onClick;
        let backgroundColor = userIsAvailable ? highLightedColor : this.state.backgroundColor;
        
        if (this.props.matchMode !== 0)
        {            
            let friendIsAvailable = false;
            let groupIsAvailable = false;
            
            if (this.props.matchMode === 1)
            {
                const friendAvailabilities = this.props.friendAvailabilities;            
                friendIsAvailable = friendAvailabilities.some(availability => availability.hour === hour && availability.weekday === weekday);
            }
            else if (this.props.matchMode === 2)
            {
                const groupAvailabilities = this.props.groupAvailabilities;
                
                groupIsAvailable = groupAvailabilities.length !== 0;
                for (var i = 0; i < groupAvailabilities.length; i++)
                {
                    const memberAvailabilities = groupAvailabilities[i];
                    const memberAvailable = memberAvailabilities.some(availability => availability.hour === hour && availability.weekday === weekday);

                    if (!memberAvailable)
                    {
                        groupIsAvailable = false;
                    }
                }
            }

            if (userIsAvailable)
            {
                if (friendIsAvailable)
                {
                    backgroundColor = 'green';
                }
                else if (groupIsAvailable)
                {
                    backgroundColor = 'green';
                }
                else
                {
                    backgroundColor = highLightedColor;
                }
            }
        }

        return (
            <div 
                onClick={onClick} 
                onMouseEnter={this.mouseEnterHandler}
                onMouseLeave={this.mouseLeaveHandler}
                style={{
                    borderStyle: "solid",
                    height: "30px", 
                    textAlign: "center", 
                    borderColor: "#3e444b",
                    backgroundColor: backgroundColor, 
                    cursor: 'pointer',
                    transition: "background-color 0.5s"
                }}
            >
            </div>
        );
    }
}

class Availabilities extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            friendUsername: '',
            friendAvailabilities: [],

            groupName: '',
            groupAvailabilities: [],

            matchMode: 0,

            highlightedHour: -1,
            highlightedWeekday: -1
        };

        this.matchWithFriend = this.matchWithFriend.bind(this);
        this.matchWithGroup = this.matchWithGroup.bind(this);        
        this.stopMatching = this.stopMatching.bind(this);
        this.highlightHour = this.highlightHour.bind(this);        
        this.highlightWeekday = this.highlightWeekday.bind(this);
    }

    async matchWithFriend()
    {
        const sessionState = this.props.methods.getSessionState();
        const sessionId = sessionState.sessionId;
        const userId = sessionState.userId;
        const friendUsername = this.state.friendUsername;

        const body = {sessionId, userId, friendUsername};

        const res = await axios.post(process.env.REACT_APP_SERVER_URL + '/friends/getFriendAvailabilities', body);
        console.log(res.data.message);
        if (!res.data.success)
        {
            return;
        }

        this.props.methods.setSessionState(res.data.content);
        this.setState(res.data.content);
        this.setState({matchMode: 1});
    }

    async matchWithGroup()
    {
        const sessionState = this.props.methods.getSessionState();
        const sessionId = sessionState.sessionId;
        const userId = sessionState.userId;
        const groupName = this.state.groupName;

        const body = {sessionId, userId, groupName};

        const res = await axios.post(process.env.REACT_APP_SERVER_URL + '/groups/getAvailabilities', body);
        console.log(res.data.message);
        if (!res.data.success)
        {
            return;
        }
        
        this.props.methods.setSessionState(res.data.content);
        this.setState(res.data.content);
        this.setState({matchMode: 2});
    }

    stopMatching()
    {
        this.setState({matchMode: 0});
    }

    highlightHour(highlightedHour)
    {
        this.setState({highlightedHour});
    }
    highlightWeekday(highlightedWeekday)
    {
        this.setState({highlightedWeekday});
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
                    Please login to access your availabilities
                </div>
            );
        }

        // What day is today?
        const now = new Date();
        const nowWeekdayNumber = (now.getDay() + 6) % 7;

        // Prepare the day columns
        const dayColumns = [];
        for (var i=0; i<7; i++)
        {
            dayColumns.push(
                <DayColumn 
                    matchMode={this.state.matchMode} 
                    friendAvailabilities={this.state.friendAvailabilities} 
                    groupAvailabilities={this.state.groupAvailabilities} 
                    key={i} 
                    methods={this.props.methods} 
                    weekday={(nowWeekdayNumber + i) % 7}
                    highlightHour={this.highlightHour}
                    highlightWeekday={this.highlightWeekday}
                    highlightedWeekday={this.state.highlightedWeekday}
                />
            );
        }

        // Match button text
        let inputs = (
            <div>
                <div style={{float: "left"}}>
                    <input value={this.state.friendUsername} onChange={(e) => this.setState({friendUsername: e.target.value})}/>
                    <input onClick={this.matchWithFriend} type='button' value="Match with friend"/>
                </div>
                <div style={{float: "right"}}>
                    <input value={this.state.groupName} onChange={(e) => this.setState({groupName: e.target.value})}/>
                    <input onClick={this.matchWithGroup} type='button' value="Match with group"/>
                </div>
            </div>
        );
        if (this.state.matchMode !== 0)
        {
            inputs = (
                <div>                    
                    <input onClick={this.stopMatching} type='button' value="Stop matching"/>
                </div>
            );
        }
        
        return (
            <div 
                style={{
                    marginLeft: "1%", 
                    marginRight: "1%"
                }}
            >
                <div 
                    style={{
                        display: "grid", 
                        gridTemplateColumns: "4% 13.7% 13.7% 13.7% 13.7% 13.7% 13.7% 13.7%", 
                        clear: "both"
                    }}
                >
                    <HoursColumn highlightedHour={this.state.highlightedHour}/>
                    {dayColumns}
                </div>
                
                <div
                    style={{
                        marginTop: "30px",
                        marginLeft: "10%",
                        marginRight: "10%"
                    }}
                >
                    {inputs}
                </div>
            </div>
        );        
    }
}

const stateToProps = state => ({
    appState: mainSelectors.getAppState(state)
});

export default connect(stateToProps)(Availabilities);
