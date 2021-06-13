const express = require('express');
const { mongo } = require('mongoose');
const mongoSanitize = require('mongo-sanitize');
const emailValidator = require('email-validator');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const { 
    handleError, 
    sendFormattedJSON, 
    validateInputs, 
    sendActivationEmail,
    cleanupAvailabilities
} = require('../lib/valiant-lib');
const router = express.Router();

router.route('/').get(async (req, res) => {
    try
    {
        users = await User.find();
        usernames = users.map(user => user.username);
        data = {success: true, message: 'Successfully retrieved usernames', content: {usernames}};
        
        sendFormattedJSON(data, res);
    }
    catch (e)
    {
        handleError(e, res, true, false, true);
    }
});

// Returns the username of the user with the given _id
router.route('/getUsernameById').post(async (req, res) => {
    try
    {
        const userId = mongoSanitize ( req.body.userId );
        const sessionId = mongoSanitize( req.body.sessionId );
        const otherUserId = mongoSanitize( req.body.otherUserId );
        
        if (validateInputs([userId, sessionId, otherUserId], res).code === 2)
        {
            return;
        }
        
        // Validate the session
        const sessions = await UserSession.find({_id: sessionId, userId});
        const sessionsCount = sessions.length;
        if (sessionsCount === 0)
        {
            handleError('Session ' + sessionId + ' is invalid', res, false, false, false);
            return;
        }
        if (sessionsCount !== 1)
        {
            throw 'Found ' + sessionsCount + ' sessions with id ' + sessionId, true, false, true;
        }

        // Get the user
        const users = await User.find({_id: otherUserId});
        const usersCount = users.length;
        let data = {};
        if (usersCount === 0)
        {
            data = {success: true, message: 'Found no user', content: {username: undefined}};
        }
        else if (usersCount === 1)
        {
            data = {success: true, message: 'Found user', content: {username: users[0].username}};
        }
        else
        {
            throw 'Found multiple users with id ' + otherUserId;
        }

        sendFormattedJSON(data, res);
    }
    catch (e)
    {
        handleError(e, res, true, false, false);
    }
});

router.route('/register').post(async (req, res) => {
    try
    {
        const username = mongoSanitize( req.body.username );
        const password = mongoSanitize( req.body.password );
        const email = mongoSanitize( req.body.email );

        // Validate the inputs
        if (validateInputs([username, password, email], res).code === 2)
        {
            return;
        }

        // Validate the email
        const validEmail = emailValidator.validate(email);
        if (!validEmail)
        {
            handleError('The provided email is invalid', res, false, false, false);
            return;
        }

        // Check that no user with the given username exists
        let users = await User.find({username});
        if (users.length !== 0)
        {
            handleError('Username taken', res, false, false, false);
            return;
        }

        // Check that no user with the given e-mail exists
        users = await User.find({email});
        if (users.length !== 0)
        {
            handleError('Email taken', res, false, false, false);
            return;
        }

        // Create the new user document and hashed password
        const newUser = new User();        
        newUser.username = username;
        newUser.email = email;
        const hashedPassword = await newUser.generateHash(password);

        // Check that the hashed password is valid
        if (!hashedPassword || hashedPassword === '')
        {
            throw 'Problem with generateHash in /register. Outputted: ' + hashedPassword;
        }
        newUser.hashedPassword = hashedPassword;

        // Create an activation token
        const validationToken = await newUser.generateValidationToken(username);
        newUser.activationToken = validationToken;
        newUser.activated = false;

        // Save to database
        await newUser.save();

        // Send an activation e-mail
        sendActivationEmail(email)
        
        // Send response
        data = {success: true, message: 'Successfully registered user ' + username + '. Check your e-mail for an activation link!'};
        sendFormattedJSON(data, res);
    }
    catch (e)
    {
        handleError(e, res, true, false, true);
    }
});

router.route('/activate').get(async (req, res) => {
    try
    {
        const email = mongoSanitize( req.query.email );
        const activationToken = mongoSanitize( req.query.activationToken );

        if (validateInputs([email, activationToken], res).code === 2)
        {
            return;
        }

        const users = await User.find({email});
        const count = users.length;
        if (count === 0)
        {
            handleError('Found no user with that email', res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' users with email ' + email;
        }
        const user = users[0];

        if (activationToken !== user.activationToken)
        {
            handleError('Wrong activation token', res, false, false, false);
            return;
        }

        // Activate
        await User.findOneAndUpdate({email}, {activated: true});

        // Send response
        //const data = {success: true, message: 'Successfully activated your account'};
        //sendFormattedJSON(data, res);

        res.send("Successfully avtivated your account. <a href='https://www.valiant-soft.ca'>Click here</a> to proceed")
    }
    catch (e)
    {
        handleError(e, res, true, false, true);
    }
})

router.route('/login').post(async (req, res) => {
    try
    {
        const username = mongoSanitize( req.body.username );
        const password = mongoSanitize( req.body.password );
        const email = mongoSanitize( req.body.email );
        
        // Validate the inputs
        if (validateInputs([username, password, email], res).code === 2)
        {
            return;
        }

        // Check if user with that email exits
        const users = await User.find({email});
        const count = users.length;
        if (count === 0)
        {
            handleError('Found no users with that email', res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' users with email ' + email;
        }
        const user = users[0];

        // Make sure the user has the given username
        if (user.username !== username)
        {
            handleError('Wrong username or e-mail', res, false, false, false);
            return;
        }

        // Check that the user is activated
        if (!user.activated)
        {
            handleError('You are not yet activated. Check your e-mail!', res, false, false, false);
            return;
        }

        // Check that the password is correct
        const valid = await user.validPassword(password);
        if (!valid)
        {
            handleError('Bad credentials', res, false, false, false);
            return;
        }
        const userId = user._id;
        const availabilities = user.availabilities;
        const friends = user.friends;
        const friendRequests = user.friendRequests;
        const groups = user.groups;

        // Create and save the UserSession
        const timestamp = new Date();
        const userSession = new UserSession({userId, timestamp});
        const savedSession = await userSession.save();
        const sessionId = savedSession._id;

        // Cleanup Availabilities
        const ret = await cleanupAvailabilities(userId, res);
        if (ret.code === 2)
        {
            return;
        }

        const data = {success: true, message: username + ' successfully logged in', content: {loggedIn: true, username, sessionId, userId, availabilities, friends, friendRequests, groups, sessionTimestamp: timestamp}};
        
        sendFormattedJSON(data, res);
    }
    catch(e)
    {
        handleError(e, res, true, false, true);
    }
});

router.route('/logoff').post(async (req, res) => {    
    try
    {
        const sessionId = mongoSanitize( req.body.sessionId );
        const userId = mongoSanitize( req.body.userId );

        // Validate the inputs
        if (validateInputs([sessionId, userId], res).code === 2)
        {
            return;
        }

        // Delete the associated session
        const deletedSessions = await UserSession.deleteMany({userId, _id: sessionId, deleted: false});
        const deletedCount = deletedSessions.deletedCount;
        if (deletedCount !== 1)
        {
            throw 'Deleted ' + deletedCount + ' sessions with id ' + sessionId;
        }
        const data = {success: true, message: 'Logged out'};

        // Cleanup Availabilities
        const ret = await cleanupAvailabilities(userId, res);
        if (ret.code === 2)
        {
            return;
        }

        sendFormattedJSON(data, res);
    }
    catch (e)
    {
        handleError(e, res, true, false, true);
    }
});

router.route('/getUserDocument').post(async (req, res) => {
    try 
    {
        const sessionId = mongoSanitize( req.body.sessionId );
        const userId = mongoSanitize( req.body.userId );

        // Validate the inputs
        if (validateInputs([sessionId, userId], res).code === 2)
        {
            return;
        }

        // Validate the session
        const sessions = await UserSession.find({_id: sessionId, userId});
        let count = sessions.length;
        if (count === 0)
        {
            handleError('Session ' + sessionId + ' is invalid', res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' sessions with id ' + sessionId;
        }
        const sessionTimestamp = sessions[0].timestamp;

        // Get the user document
        const users = await User.find({_id: userId});
        count = users.length;
        if (count === 0)
        {
            handleError('Found no users with such an ID', res, false, false, false);
            return;
        } 
        if (count !== 1)
        {
            throw 'Found ' + count + ' users with ID ' + userId;
        }
        const user = users[0];

        // Get the content you want to return
        const content = {
            loggedIn: true, 
            username: user.username, 
            sessionId,
            userId,
            availabilities: user.availabilities,
            friends: user.friends,
            friendRequests: user.friendRequests,
            groups: user.groups,
            sessionTimestamp
        };

        // Send response
        const data = {success: true, message: 'Successfully retrieved user document', content};
        sendFormattedJSON(data, res);
    }
    catch (e)
    {
        handleError(e, res, true, false, true);
    }
});

// Returns {success, message, content: {valid}}
router.route('/isUserSessionValid').post(async (req, res) => {
    try
    {
        const sessionId = mongoSanitize( req.body.sessionId );
        const userId = mongoSanitize( req.body.userId );
        
        // Validate the inputs
        if (validateInputs([sessionId, userId], res).code === 2)
        {
            return;
        }

        // Validate the session
        const sessions = await UserSession.find({_id: sessionId, userId});
        const count = sessions.length;
        if (count === 0)
        {
            handleError('Session ' + sessionId + ' is invalid', res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' sessions with id ' + sessionId;
        }

        // Send a response
        const data = {success: true, message: 'Session is valid', content: {valid: true}};
        sendFormattedJSON(data, res);
    }
    catch (e)
    {
        handleError(e, res, true, true ,true);
    }
});

// Returns {success, message}
router.route('/regenerateSession').post(async (req, res) => {
    try
    {
        const sessionId = mongoSanitize( req.body.sessionId );
        const userId = mongoSanitize( req.body.userId );

        // Validate the inputs
        if (validateInputs([sessionId, userId], res).code === 2)
        {
            return;
        }

        res.json({success: false, message: 'This endpoint has not been fully configured yet'});
    }
    catch (e)
    {
        handleError(e, res, true, false, true);
    }
});

module.exports = router;
