import React from 'react';
import axios from 'axios';

class UserList extends React.Component 
{
    constructor(props)
    {
        super(props);
        this.state = {usernameList: []};
    }

    async componentDidMount()
    {
        const res = await axios.get(process.env.REACT_APP_SERVER_URL + "/users/");
        const success = res.data.success;
        console.log(res.data.message);
        if (!success)
        {
            return;
        }
        const usernames = res.data.content.usernames;
        this.setState({usernameList: usernames});
    }

    render()
    {
        return (
            <div
                style={{
                    textAlign: "center",
                    marginTop: "10%"
                }}
            >
                <h3
                    style={{
                    }}
                >
                    User List
                </h3>

                <div
                    style={{
                        borderStyle: "solid",
                        display: "inline-block",
                        borderRadius: "10px",
                        padding: "20px",
                        marginTop: "20px"
                    }}
                >
                    {this.state.usernameList.map(username => (<li key={username}>{username}</li>))}
                </div>
            </div>    
        );
    }
}
    
export default UserList;
    