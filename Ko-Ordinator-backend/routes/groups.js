const express = require('express');
const mongoSanitize = require('mongo-sanitize');
const router = express.Router();
const { 
    handleError, 
    validateInputs, 
    validateSession, 
    sendFormattedJSON, 
    regenerateSession,
    getGroupAvailabilities,
    getGroupByName,
    getUserById,
} = require('../lib/valiant-lib');
const Group = require('../models/Group');
const User = require('../models/User');



router.route('/').get((req, res) => {
    res.send('This router is working');
})

router.route('/create').post(async (req, res) => {
    try
    {
        const sessionId = mongoSanitize(req.body.sessionId);
        const userId = mongoSanitize(req.body.userId);
        const name = mongoSanitize(req.body.name);
        let password = mongoSanitize(req.body.password);

        // Validate the inputs
        if (validateInputs([sessionId, userId, name, password]).code === 2)
        {
            return;
        }

        // Validate the session
        if (await validateSession(sessionId, userId).code === 2)
        {
            return;
        }

        // Make sure the group name dosen't already exist
        let groups = await Group.find({name});
        let count = groups.length;
        if (count === 1)
        {
            handleError('Found an existing group called ' + name, res, false, false, false);
            return;
        }
        if (count !== 0)
        {
            throw 'Found ' + count + ' groups with name ' + name;
        }

        // Get user's username
        let user = await getUserById(userId, res);
        if (user.code === 2)
        {
            return;
        }
        user = user.value;
        const username = user.username;

        // Create the new group
        const newGroup = new Group({name, members: [username]});
        password = await newGroup.generateHash(password);
        newGroup.password = password;

        // Save the new group
        newGroup.save();

        // Add the group to the user's document
        groups = user.groups;
        if (groups.every(group => group.toString() !== name.toString()))
        {
            groups.push(name);
        }
        await User.findOneAndUpdate({_id: userId}, {groups});

        // Prepare and send the response
        const data = {success: true, message: 'Successfully created group ' + name, content: {groups}};
        sendFormattedJSON(data, res);
    }
    catch (e)
    {
        handleError(e, res, true, false, true);
    }
});

router.route('/join').post(async (req, res) => {
    try
    {
        const sessionId = mongoSanitize(req.body.sessionId);
        const userId = mongoSanitize(req.body.userId);
        const name = mongoSanitize(req.body.name);        
        const password = mongoSanitize(req.body.password);

        if (validateInputs([sessionId, userId, name, password], res).code === 2)
        {
            return;
        }

        // Validate the session
        if (await validateSession(sessionId, userId, res).code === 2)
        {
            return;
        }

        // Get the group and its members
        let groups = await Group.find({name});
        let count = groups.length;
        if (count === 0)
        {
            handleError('Found no group with that name', res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' groups with the name ' + name;
        }
        const group = groups[0];
        const members = group.members;

        // Validate the password
        const valid = await group.validPassword(password);
        if (!valid)
        {
            handleError('The password you have provided is invalid', res, false, false, false);
            return;
        }

        // Get the user
        let user = await getUserById(userId, res);
        if (user.code === 2)
        {
            return;
        }
        user = user.value;

        // Check if the user is already in the members
        const isMember = members.some(member => member.toString() === user.username.toString());
        if (isMember)
        {
            handleError('You are already a member of ' + name, res, false, false, false);
            return;
        }

        // Not member, add to LOCAL array and then update the mongoDB document
        members.push(user.username);
        await Group.findOneAndUpdate({name}, {members});

        // Add the group to the user's document
        groups = user.groups;
        if (groups.every(group => group.toString() !== name.toString()))
        {
            groups.push(name);
        }
        await User.findOneAndUpdate({_id: userId}, {groups});

        // Prepare and send back a response
        const data = {success: true, message: 'Successfully joined ' + name, content: {groups}};
        sendFormattedJSON(data, res);
    }
    catch (e)
    {
        handleError(e, res, true, false, true);
    }
});

router.route('/leave').post(async (req, res) => {
    try
    {
        const sessionId = mongoSanitize(req.body.sessionId);
        const userId = mongoSanitize(req.body.userId);
        const name = mongoSanitize(req.body.name);        

        if (validateInputs([sessionId, userId, name], res).code === 2)
        {
            return;
        }

        // Validate the session
        if (await validateSession(sessionId, userId, res).code === 2)
        {
            return;
        }

        // Get the group and its members
        let groups = await Group.find({name});
        let count = groups.length;
        if (count === 0)
        {
            handleError('Found no group with that name', res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' groups with the name ' + name;
        }
        const group = groups[0];
        let members = group.members;

        // Get the user
        let user = await getUserById(userId, res);
        if (user.code === 2)
        {
            return;
        }
        user = user.value;

        // Check if the user is in the members
        const isMember = members.some(member => member.toString() === user.username.toString());
        if (!isMember)
        {
            handleError('You are not a member of ' + name, res, false, false, false);
            return;
        }

        // Remove from LOCAL array and then update the mongoDB document
        members = members.filter(member => member.toString() !== user.username.toString());
        await Group.findOneAndUpdate({name}, {members});

        // Remove the group from the user's document
        groups = user.groups;
        if (groups.some(group => group.toString() === name.toString()))
        {
            groups = groups.filter(group => group.toString() !== name.toString());
        }
        await User.findOneAndUpdate({_id: userId}, {groups});

        // Prepare and send back a response
        const data = {success: true, message: 'Successfully left ' + name, content: {groups}};
        sendFormattedJSON(data, res);
    }
    catch (e)
    {
        handleError(e, res, true, false, true);
    }
});

router.route('/getAvailabilities').post(async (req, res) => {
    try
    {
        const sessionId = mongoSanitize(req.body.sessionId);
        const userId = mongoSanitize(req.body.userId);
        const groupName = mongoSanitize(req.body.groupName);

        // Validate the inputs
        if (validateInputs([sessionId, userId, groupName], res).code === 2)
        {
            return;
        }

        // Validate session
        if (validateSession(sessionId, userId, res).code === 2)
        {
            return;
        }
        
        // Get user's username
        let user = await getUserById(userId, res);
        if (user.code === 2)
        {
            return;
        }
        user = user.value;
        const username = user.username;
        
        // Ge the group with name: groupName
        let group = await getGroupByName(groupName ,res);
        if (group.code === 2)
        {
            return;
        }
        group = group.value;
        const members = group.members;
        
        // Check if the user is in the group
        if (!members.some(member => member.toString() === username.toString()))
        {
            handleError('You are not in the group ' + groupName, res, false, false, false);
        }

        // Get each user's availabilities
        let groupAvailabilities = await getGroupAvailabilities(username, members, res);
        if (groupAvailabilities.code === 2)
        {
            return;
        }
        groupAvailabilities = groupAvailabilities.value;

        // Regenerate the session
        let newSessionId = await regenerateSession(sessionId, userId, res);
        if (newSessionId.code === 2)
        {
            return;
        }
        newSessionId = newSessionId.value;

        // Prepare and send a response
        const data = {success: true, message: 'Successfully retrieved group availabilities', content: {groupAvailabilities, sessionId: newSessionId}};
        sendFormattedJSON(data, res);
    }
    catch (e)
    {
        handleError(e, res, true, true, true);
    }
});

router.route('/getMembers').post(async (req, res) => {
    try
    {
        const sessionId = mongoSanitize( req.body.sessionId );
        const userId = mongoSanitize( req.body.userId );
        const name = mongoSanitize( req.body.name );

        // Validate the inputs
        if (validateInputs([sessionId, userId, name], res).code === 2)
        {
            return;
        }

        // Validate the session
        if (validateSession(sessionId, userId, res).code === 2)
        {
            return;
        }

        // Get the user
        let user = await getUserById(userId, res);
        if (user.code === 2)
        {
            return;
        }
        user = user.value;
        const username = user.username;

        // Get the group members
        let group = await getGroupByName(name, res);
        if (group.code === 2)
        {
            return;
        }
        group = group.value;
        const members = group.members;

        // Make sure the user is in members
        if (!members.some(member => member.toString() === username.toString()))
        {
            handleError('You are not part of ' + name, res, false, false, false);
            return;
        }
        
        // Prepare and send a response
        const data = {success: true, message: 'Successfully retrieved group members', content: {members}};
        sendFormattedJSON(data, res);
    }
    catch (e)
    {
        handleError(e, res, true, false, true);
    }
})

module.exports = router;
