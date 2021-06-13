import axios from 'axios';

export async function getAvailabilities()
{
    const sessionId = sessionStorage.getItem('sessionId');
    const userId = sessionStorage.getItem('userId');
    const body = {sessionId, userId};

    const res = await axios.post(process.env.REACT_APP_SERVER_URL + '/availabilities/get', body);
    const success = res.data.success;
    console.log('Fetching availabilities... ' + res.data.message);
    if (!success)
    {
        return [];
    }
    
    // Get the new session id
    const newSessionId = res.data.content.sessionId;
    sessionStorage.setItem('sessionId', newSessionId);

    return res.data.content.availabilities;
}

export async function getFriends()
{
    const sessionId = sessionStorage.getItem('sessionId');
    const userId = sessionStorage.getItem('userId');
    const body = {sessionId, userId};

    const res = await axios.post(process.env.REACT_APP_SERVER_URL + '/friends/getFriends', body);
    const success = res.data.success;
    console.log('Fetching friends... ' + res.data.message);
    if (!success)
    {
        return [];
    }

    // Get the new session id
    const newSessionId = res.data.content.sessionId;
    sessionStorage.setItem('sessionId', newSessionId);

    return res.data.content.friends;   
}

export async function getFriendRequests()
{
    const sessionId = sessionStorage.getItem('sessionId');
    const userId = sessionStorage.getItem('userId');
    const body = {sessionId, userId};

    const res = await axios.post(process.env.REACT_APP_SERVER_URL + '/friends/getFriends', body);
    const success = res.data.success;
    console.log('Fetching friends... ' + res.data.message);
    if (!success)
    {
        return [];
    }

    // Get the new session id
    const newSessionId = res.data.content.sessionId;
    sessionStorage.setItem('sessionId', newSessionId);

    return res.data.content.friendRequests;   
}

export async function addFriendById(friendId)
{
    const sessionId = sessionStorage.getItem('sessionId');
    const userId = sessionStorage.getItem('userId');
    const body = {sessionId, userId, friendId};

    const res = await axios.post(process.env.REACT_APP_SERVER_URL + '/friends/add', body);
    const success = res.data.success;
    console.log('Adding friend... ' + res.data.message);
    if (!success)
    {
        return;
    }

    // Get the new session id
    const newSessionId = res.data.content.sessionId;
    sessionStorage.setItem('sessionId', newSessionId);

    return;   
}

export async function addFriend(username)
{
    console.log('You are using a deprecated function');  
}
