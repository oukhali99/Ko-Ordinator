const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Log = require('../models/Log');
const UserSession = require('../models/UserSession');
const User = require('../models/User');
const Group = require('../models/Group');
require('dotenv').config();

var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL,
        pass: process.env.GMAIL_PASSWORD
    }
});

async function sendEmail(to, subject, html)
{
    var mailOptions = {
        from: process.env.GMAIL,
        to,
        subject,
        html
    };
      
    await transporter.sendMail(mailOptions);
}

function handleError(err, res, log=false, verbose=false, hideFromClient=true) {
    const message = err.toString();
    
    if (res)
    {
        if (hideFromClient)
        {
            res.json({success: false, message: 'Unexpected server error'});
        }
        else
        {
            res.json({success: false, message: message});
        }
    }

    if (verbose)
    {
        console.log(err);
    }

    if (log)
    {
        const newLog = new Log({message: message});

        
        try
        {
            newLog.save();
        }
        catch (e)
        {
            console.log('Logger error: ' + e.toString())
        }
    }
}

function sendFormattedJSON(data, res)
{
    res.header("Content-Type",'application/json');
    res.send(JSON.stringify(data, null ,4));
}

async function validLogsPassword(password)
{
    return await bcrypt.compare(password, process.env.LOGS_PASSWORD);
}

function validateInputs(inputs, res)
{
    const invalid = inputs.some(input => input === undefined || input === '');
    
    if (invalid)
    {
        handleError('Please provide the appropriate inputs', res, false, false, false);
        return {code: 2};
    }

    return {code: 0, value: true};
}

async function validateSession(sessionId, userId, res)
{
    const sessions = await UserSession.find({_id: sessionId, userId});
    const count = sessions.length;
    if (count === 0)
    {
        handleError('Found no sessions with that ID', res, false, false, false);
        return {code: 2};
    }
    if (count !== 1)
    {
        throw 'Found ' + count + ' sessions with id ';
    }

    return {code: 0, value: true};
}

async function regenerateSession(sessionId, userId, res)
{
    const sessions = await UserSession.find({_id: sessionId, userId});
    const count = sessions.length;
    if (count === 0)
    {
        handleError('Found no session with that ID', res, false, false, false);
        return {code: 2};
    }
    if (count !== 1)
    {
        throw 'Found ' + count + ' sessions with ID ' + sessionId;
    }

    // Create the new session
    const newSession = new UserSession({userId});
    await newSession.save();

    // Delete the old session
    UserSession.deleteMany({_id: sessionId, userId});

    return {code: 0, value: newSession._id};
}

async function sendActivationEmail(email)
{
    const users = await User.find({email});
    const count = users.length;
    if (count !== 1)
    {
        throw 'Did not find a unique user with that e-mail ' + email;
    }
    const user = users[0];

    // Check if already activated
    if (user.activated)
    {
        throw 'Tried to send activation email to an already activated account ' + email;
    } 

    // Prepare the e-mail html
    const activationToken = user.activationToken;
    const href = 'https://' + process.env.HOSTNAME + ':' + process.env.PORT + '/users/activate?email=' + email + '&activationToken=' + activationToken;
    const html = 'To activate your account, <a href="' + href + '">click here</a>';

    //await sendEmail(email, 'Welcome to Ko-Ordinator!', html);
}

async function cleanupAvailabilities(userId, res)
{
    const users = await getUserById(userId, res);
    if (users.code === 2)
    {
        return {code: 2};
    }
    const user = users.value;
    const availabilities = user.availabilities;
    const newAvailabilities = [];
    const dayOfTheMonth = (new Date()).getDate();

    // Filter out the invalid availabilites
    for (var i=0; i<availabilities.length; i++)
    {
        const availability = availabilities[i];
        const availabilityDayOfTheMonth = availability.dayOfTheMonth;

        if (availabilityDayOfTheMonth < dayOfTheMonth)
        {
            continue;
        }
        if (availabilityDayOfTheMonth >= dayOfTheMonth + 6)
        {
            continue;
        }

        newAvailabilities.push(availability);
    }

    // Update the User document in the database
    user.availabilities = newAvailabilities;
    await user.save();
    
    return {code: 0};
}

async function cleanupAvailabilitiesByUsername(username, res)
{
    const users = await getUserByUsername(username, res);
    if (users.code === 2)
    {
        return {code: 2};
    }
    const user = users.value;
    const availabilities = user.availabilities;
    const newAvailabilities = [];
    const dayOfTheMonth = (new Date()).getDate();

    // Filter out the invalid availabilites
    for (var i=0; i<availabilities.length; i++)
    {
        const availability = availabilities[i];
        const availabilityDayOfTheMonth = availability.dayOfTheMonth;

        if (availabilityDayOfTheMonth < dayOfTheMonth)
        {
            continue;
        }
        if (availabilityDayOfTheMonth >= dayOfTheMonth + 6)
        {
            continue;
        }

        newAvailabilities.push(availability);
    }

    // Update the User document in the database
    user.availabilities = newAvailabilities;
    await user.save();
    
    return {code: 0};
}

async function getGroupByName(name, res)
{
    const groups = await Group.find({name});
    const count = groups.length;
    if (count === 0)
    {
        handleError('Found no groups with the name ' + name, res, false, false, false);
        return {code: 2};
    }
    if (count !== 1)
    {
        throw 'Found ' + count + ' groups with name ' + name;
    }

    return {code: 0, value: groups[0]};
}

async function getGroupAvailabilities(username, members, res)
{
    let groupAvailabilities = [];
    const membersCount = members.length;
    for (var i = 0; i < membersCount; i++)
    {
        if (username.toString() === members[i].toString())
        {
            continue;
        }

        // Cleanup Member's Availabilities
        const ret = await cleanupAvailabilitiesByUsername(members[i], res);
        if (ret.code === 2)
        {
            return {code: 2};
        }
        
        let member = await getUserByUsername(members[i], res);
        if (member.code === 2)
        {
            return {code: 2};
        }
        member = member.value;
        const memberAvailabilities = member.availabilities;
        
        groupAvailabilities.push(memberAvailabilities);
    }
    
    return {code: 0, value: groupAvailabilities};
}

async function getUserById(userId, res)
{
    const users = await User.find({_id: userId});
    const count = users.length;
    if (count === 0)
    {
        handleError('Could not find a user with the given ID', res, false, false, false);
        return {code: 2};
    }
    if (count !== 1)
    {
        throw 'Found ' + count + ' users with ID ' + userId;
    }

    return {code: 0, value: users[0]};
}

async function getUserByUsername(username, res)
{
    const users = await User.find({username});
    const count = users.length;
    if (count === 0)
    {
        handleError('Could not find a user with the given username', res, false, false, false);
        return {code: 2};
    }
    if (count !== 1)
    {
        throw 'Found ' + count + ' users with ID ' + userId;
    }

    return {code: 0, value: users[0]};
}

module.exports = {  
    handleError, 
    sendFormattedJSON, 
    validateInputs, 
    validLogsPassword, 
    validateSession, 
    regenerateSession,
    sendActivationEmail,
    cleanupAvailabilities,
    cleanupAvailabilitiesByUsername,
    getGroupByName,
    getGroupAvailabilities,
    getUserById,
    getUserByUsername
};
