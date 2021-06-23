const express = require('express');
const mongoSanitize = require('mongo-sanitize');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const { 
    handleError, 
    sendFormattedJSON, 
    validateInputs,
    cleanupAvailabilities
} = require('../lib/valiant-lib');
const router = express.Router();

router.route('/').get((req, res) => {
    res.send('This router is working');
})

router.route('/add').post(async (req, res) => {
    try
    {
        let sessionId = mongoSanitize( req.body.sessionId );       
        let userId = mongoSanitize( req.body.userId );
        let friendUsername = mongoSanitize( req.body.friendUsername );

        // Validate input
        if (validateInputs([sessionId, userId, friendUsername], res).code === 2)
        {
            return;
        }

        // Validate the user session
        const sessions = await UserSession.find({_id: sessionId, userId});
        let count = sessions.length;
        if (count === 0)
        {
            handleError('The provided sessionId is invalid', res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' sessions with ID ' + sessionId;
        }
        const session = sessions[0];

        // Get the sender's document, friends and friendRequests
        let users = await User.find({_id: userId});
        count = users.length;
        if (count === 0)
        {
            handleError('The provided userId is invalid', res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' users with ID ' + userId;
        }
        const user = users[0];
        const username = user.username;
        let friends = user.friends;
        let friendRequests = user.friendRequests;
        
        // Get the receiver's document, friends and friendRequests
        users = await User.find({username: friendUsername});
        count = users.length;
        if (count === 0)
        {
            handleError('Could not find this ' + friendUsername + ' you are trying to add', res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' users with username ' + friendUsername;
        }
        const friendUser = users[0];
        let friendFriends = friendUser.friends;
        let friendFriendRequests = friendUser.friendRequests;
        friendId = friendUser._id;

        // Check if friend is already in user's friends array
        if (friends.some(friend => friend.toString() === friendUsername.toString()))
        {
            handleError('You are already friends with this user', res, false, false, false);
            return;
        }
        
        // Trying to add yourself check
        if (friendId.toString() === userId.toString())
        {
            handleError('You cannot send yourself a friend request', res, false, false, false);
            return;
        }
        
        // Friend has already requested a friendship, accept it
        let message;
        if (friendRequests.some(friendRequest => friendRequest.toString() === friendUsername.toString()))
        {
            // Move the friendUsername from friendRequests to friends
            if (friends.every(friend => friend.toString !== friendUsername.toString())) {friends.push(friendUsername.toString());}
            friendRequests = friendRequests.filter(friendRequest => friendRequest.toString() !== friendUsername.toString());

            // Add userId to friendFriends and remove from friendFriendRequests if there
            if (friendFriends.every(friend => friend.toString() !== username.toString())) {friendFriends.push(username.toString());}
            friendFriendRequests = friendFriendRequests.filter(friendRequest => friendRequest.toString() !== username.toString());

            // Prepare response
            message = 'Accepted friend request';
        }
        // Send a friend request
        else
        {
            // True. You have already send this user a friend request
            if (friendFriendRequests.some(friendFriendRequest => friendFriendRequest.toString() === username.toString()))
            {
                handleError('You have already sent a friend request to this user', res, false, false, false);
                return;
            }

            // False. Send this user a friend request
            friendFriendRequests.push(username.toString());
            message = 'Successfully sent this user a friend request';
        }
        
        // Push the local arrays to the database to reflect changes
        await User.findOneAndUpdate({_id: userId}, {friends, friendRequests});
        await User.findOneAndUpdate({_id: friendId}, {friends: friendFriends, friendRequests: friendFriendRequests});

        // Create and save new session
        const newSession = await new UserSession({userId, timestamp: new Date()}).save();
        const newSessionId = newSession._id;

        // Delete old session
        await UserSession.deleteMany({_id: sessionId, userId});

        // Prepare response
        const data = {success: true, message, content: {sessionId: newSessionId, friends, friendRequests}};

        // Send response
        sendFormattedJSON(data, res);
        return;
    }
    catch (e)
    {
        handleError(e, res, true, true, true);
        return;
    }
});

router.route('/remove').post(async (req, res) => {
    try
    {
        let sessionId = mongoSanitize( req.body.sessionId );       
        let userId = mongoSanitize( req.body.userId );
        let friendUsername = mongoSanitize( req.body.friendUsername );

        // Validate input
        if (validateInputs([sessionId, userId, friendUsername], res).code === 2)
        {
            return;
        }

        // Validate the user session
        const sessions = await UserSession.find({_id: sessionId, userId});
        let count = sessions.length;
        if (count === 0)
        {
            handleError('The provided sessionId is invalid', res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' sessions with ID ' + sessionId;
        }
        const session = sessions[0];

        // Get the sender's document, friends and friendRequests
        let users = await User.find({_id: userId});
        count = users.length;
        if (count === 0)
        {
            handleError('The provided userId is invalid', res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' users with ID ' + userId;
        }
        const user = users[0];
        const username = user.username;
        let friends = user.friends;
        let friendRequests = user.friendRequests;
        
        // Get the receiver's document, friends and friendRequests
        users = await User.find({username: friendUsername});
        count = users.length;
        if (count === 0)
        {
            handleError('Could not find this ' + friendUsername + ' you are trying to add', res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' users with username ' + friendUsername;
        }
        const friendUser = users[0];
        let friendFriends = friendUser.friends;
        let friendFriendRequests = friendUser.friendRequests;
        friendId = friendUser._id;

        // Check if friend is in user's friends array
        if (!friends.some(friend => friend.toString() === friendUsername.toString()))
        {
            handleError('You are not friends with this user', res, false, false, false);
            return;
        }
        
        // Trying to remove yourself check
        if (friendId.toString() === userId.toString())
        {
            handleError('You cannot remove yourself as a friend', res, false, false, false);
            return;
        }
        
        // Friend has sent a friend request, decline it
        const x = {success: false, message: 'Removing friends has not yet been implemented by the valiant-soft team'};
        sendFormattedJSON(x, res);
        return;
        
        // Push the local arrays to the database to reflect changes
        await User.findOneAndUpdate({_id: userId}, {friends, friendRequests});
        await User.findOneAndUpdate({_id: friendId}, {friends: friendFriends, friendRequests: friendFriendRequests});

        // Create and save new session
        const newSession = await new UserSession({userId, timestamp: new Date()}).save();
        const newSessionId = newSession._id;

        // Delete old session
        await UserSession.deleteMany({_id: sessionId, userId});

        // Prepare response
        const data = {success: true, message, content: {sessionId: newSessionId, friends, friendRequests}};

        // Send response
        sendFormattedJSON(data, res);
        return;
    }
    catch (e)
    {
        handleError(e, res, true, true, true);
        return;
    }
});

router.route('/getFriendRequests').post(async (req, res) => {
    try
    {
        const sessionId = mongoSanitize( req.body.sessionId );
        const userId = mongoSanitize( req.body.userId );

        // Validate the inputs
        if (validateInputs([sessionId, userId], res).code === 2)
        {
            return;
        }

        // Validate the user session
        const sessions = await UserSession.find({_id: sessionId, userId});
        let count = sessions.length;
        if (count === 0)
        {
            handleError('Session ID ' + sessionId + ' invalid', res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' sessions with ID ' + sessionId;
        }
        const session = sessions[0];

        // Get the user document
        const users = await User.find({_id: userId});
        const usersCount = users.length;
        if (usersCount === 0)
        {
            handleError('Found no user as described', res, false, false, false);
            return;
        }
        if (usersCount !== 1)
        {
            handleError('Found ' + usersCount + ' users with the id ' + userId, res, true, false, true);
            return;
        }
        const user = users[0];

        // Get the user's friend requests
        const friendRequests = user.friendRequests;

        // Create and save new session
        const newSession = await new UserSession({userId, timestamp: new Date()}).save();
        const newSessionId = newSession._id;

        // Delete old session
        await UserSession.deleteMany({_id: sessionId, userId});

        // Return the data
        const data = {success: true, message: 'Successfully retrieved the friend requests', content: {friendRequests, sessionId: newSessionId}};
        sendFormattedJSON(data, res);
    }
    catch (e)
    {
        handleError(e, res, true, false, true);
    }
});

router.route('/getFriends').post(async (req, res) => {
    try
    {
        const sessionId = mongoSanitize( req.body.sessionId );
        const userId = mongoSanitize( req.body.userId );

        // Validate the inputs
        if (validateInputs([sessionId, userId], res).code === 2)
        {
            return;
        }

        // Validate the user session
        const sessions = await UserSession.find({_id: sessionId, userId});
        let count = sessions.length;
        if (count === 0)
        {
            handleError('Session ID ' + sessionId + ' invalid', res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' sessions with ID ' + sessionId;
        }
        const session = sessions[0];

        // Get the user document
        const users = await User.find({_id: userId});
        const usersCount = users.length;
        if (usersCount === 0)
        {
            handleError('Found no user as described', res, false, false, false);
            return;
        }
        if (usersCount !== 1)
        {
            handleError('Found ' + usersCount + ' users with the id ' + userId, res, true, false, true);
            return;
        }
        const user = users[0];

        // Get the user's friend requests
        const friendRequests = user.friendRequests;

        // Create and save new session
        const newSession = await new UserSession({userId, timestamp: new Date()}).save();
        const newSessionId = newSession._id;

        // Delete old session
        await UserSession.deleteMany({_id: sessionId, userId});        

        // Return the data
        const data = {success: true, message: 'Successfully retrieved the friend requests', content: {friendRequests, sessionId: newSessionId}};
        sendFormattedJSON(data, res);
    }
    catch (e)
    {
        handleError(e, res, true, false, true);
    }
});

router.route('/getFriendAvailabilities').post(async (req, res) => {
    try
    {
        let sessionId = mongoSanitize( req.body.sessionId );
        let userId = mongoSanitize( req.body.userId );
        let friendUsername = mongoSanitize( req.body.friendUsername );

        if (validateInputs([sessionId, userId, friendUsername], res).code === 2)
        {
            return;
        }

        // Validate the user session
        const sessions = await UserSession.find({_id: sessionId, userId});
        let count = sessions.length;
        if (count === 0)
        {
            handleError('The provided sessionId is invalid', res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' sessions with ID ' + sessionId;
        }
        const session = sessions[0];

        // Get the user document
        let users = await User.find({_id: userId});
        count = users.length;
        if (count === 0)
        {
            handleError('Found no user with that ID', res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' users with id ' + userId;
        }
        const user = users[0];

        // Get the friend's document
        users = await User.find({username: friendUsername});
        count = users.length;
        if (count === 0)
        {
            handleError('Did not find user ' + friendUsername, res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' users with username ' + friendUsername;
        }
        const friend = users[0];
        
        // Cleanup friend's Availabilities
        const ret = await cleanupAvailabilities(friend._id, res);
        if (ret.code === 2)
        {
            return;
        }

        // Make sure the id is in user's friends
        const areFriends = user.friends.some(friend => friend.toString() === friendUsername.toString());
        if (!areFriends)
        {
            handleError(friendUsername + ' is not in your friendsList', res, false, false, false);
            return;
        }

        // Get the friend's availabilities
        const friendAvailabilities = friend.availabilities;

        // Create and save new session
        const newSession = await new UserSession({userId, timestamp: new Date()}).save();
        const newSessionId = newSession._id;

        // Delete old session
        await UserSession.deleteMany({_id: sessionId, userId});

        // Send response
        const content = {friendAvailabilities, sessionId: newSessionId};
        const data = {success: true, message: 'Successfully retrieved ' + friendUsername + "'s availabilities", content};
        sendFormattedJSON(data, res);
    }
    catch (e)
    {
        handleError(e, res, true, false, true);
    }
});

module.exports = router;
