const express = require('express');
const mongoSanitize = require('mongo-sanitize');
const router = express.Router();
const {
    handleError, 
    sendFormattedJSON, 
    validateInputs,
    cleanupAvailabilities
} = require('../lib/valiant-lib');
const UserSession = require('../models/UserSession');
const User = require('../models/User');

router.route('/').get((req, res) => {
    res.send('This router is working');
});

router.route('/add').post(async (req, res) => {
    try
    {
        const day = mongoSanitize( req.body.weekday );
        const hour = mongoSanitize( req.body.hour );
        const userId = mongoSanitize( req.body.userId );
        const sessionId = mongoSanitize( req.body.sessionId );

        // Validate the inputs
        if (validateInputs([day, hour, userId, sessionId], res).code === 2)
        {
            return;
        }    

        // Parse the inputs into numbers
        const dayInt = parseInt(day);
        const hourInt = parseInt(hour);

        // Validate the parsed numbers
        if(validateInputs([dayInt, hourInt], res).code === 2)
        {
            return;
        }
        if (dayInt < 0 || dayInt > 6 || hourInt < 0 || hourInt > 23)
        {
            handleError('Day must be in [0, 6] and hour in [0, 23]', res, false, false, false);
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

        // Cleanup Availabilities
        const ret = await cleanupAvailabilities(userId, res);
        if (ret.code === 2)
        {
            return;
        }

        // Get the user document and availabilities
        const users = await User.find({_id: userId});
        count = users.length;
        if (count === 0)
        {
            handleError('No user with ID ' + userId + ' found', res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' users with ID ' + userId;
        }
        const user = users[0];
        const availabilities = user.availabilities;

        // Check if availability exists
        const availabilityExists = availabilities.some(availability => 
            availability.weekday === dayInt && availability.hour === hourInt
        );
        if (availabilityExists)
        {
            handleError('Availability hour: ' + hourInt + ' weekday: ' + dayInt + ' already exists', res, false, false, false);
            return;
        }

        // Add the new availability to the LOCAL array
        availabilities.push({
            'weekday': dayInt, 
            'hour': hourInt,
            'dayOfTheMonth': (new Date()).getDate()
        });
        
        // Update the user DOCUMENT's availability array
        await User.findOneAndUpdate({_id: userId}, {availabilities});

        // Create and save new session
        const newSession = await new UserSession({userId, timestamp: new Date()}).save();

        // Delete old session
        await UserSession.deleteMany({_id: sessionId, userId});

        // Send the savedAvailability data
        const data = {success: true, message: 'Successfully added availability', content: {sessionId: newSession._id, availabilities}};
        sendFormattedJSON(data, res);
    }
    catch (e)
    {
        handleError(e, res, true, false, true);
    }
});

router.route('/remove').post(async (req, res) => {
    try
    {
        let weekday = mongoSanitize( req.body.weekday );
        let hour = mongoSanitize( req.body.hour);
        const userId = mongoSanitize( req.body.userId );
        const sessionId = mongoSanitize( req.body.sessionId );
        
        // Validate the inputs
        if(validateInputs([weekday, hour, userId, sessionId], res).code === 2)
        {
            return;
        }

        // Parse the inputs into numbers
        weekday = parseInt(weekday);
        hour = parseInt(hour);

        // Validate the parsed numbers
        if(validateInputs([weekday, hour], res).code === 2)
        {
            return;
        }
        if (weekday < 0 || weekday > 6 || hour < 0 || hour > 23)
        {
            handleError('Day must be in [0. 6] and hour in [0, 23]', res, false, false, false);
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

        // Cleanup Availabilities
        const ret = await cleanupAvailabilities(userId, res);
        if (ret.code === 2)
        {
            return;
        }

        // Get the user document and availabilities
        const users = await User.find({_id: userId});
        count = users.length;
        if (count === 0)
        {
            handleError('No user with ID ' + userId + ' found', res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' users with ID ' + userId;
        }
        const user = users[0];
        const availabilities = user.availabilities;

        // Check if availability exists
        const availabilityExists = availabilities.some(availability => 
            availability.weekday === weekday && availability.hour === hour
        );
        if (!availabilityExists)
        {
            handleError('Availability hour: ' + hour + ' weekday: ' + weekday + ' does not exist', res, false, false, false);
            return;
        }

        // Remove the availability from the LOCAL array
        const newAvailabilities = availabilities.filter(availability => availability.weekday !== weekday || availability.hour !== hour);

        // Update the user DOCUMENT
        await User.findOneAndUpdate({_id: userId}, {availabilities: newAvailabilities});

        // Create and save new session
        const newSession = await new UserSession({userId, timestamp: new Date()}).save();

        // Delete old session
        await UserSession.deleteMany({_id: sessionId, userId});

        // Tell the user it was successful
        const data = {success: true, message: 'Successfully deleted the described availability', content: {sessionId: newSession._id, availabilities: newAvailabilities}};
        sendFormattedJSON(data, res);
    }
    catch (e)
    {
        handleError(e, res, true, false, true);
    }
});

router.route('/get').post(async (req, res) => {
    try
    {
        const sessionId = mongoSanitize( req.body.sessionId );
        const userId = mongoSanitize( req.body.userId );

        // Validate the inputs
        if(validateInputs([userId, sessionId], res).code === 2)
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

        // Cleanup Availabilities
        const ret = await cleanupAvailabilities(userId, res);
        if (ret.code === 2)
        {
            return;
        }

        // Get the user document and availabilities
        const users = await User.find({_id: userId});
        count = users.length;
        if (count === 0)
        {
            handleError('No user with ID ' + userId + ' found', res, false, false, false);
            return;
        }
        if (count !== 1)
        {
            throw 'Found ' + count + ' users with ID ' + userId;
        }
        const user = users[0];
        const availabilities = user.availabilities;

        // Create and save new session
        const newSession = await new UserSession({userId, timestamp: new Date()}).save();

        // Delete old session
        await UserSession.deleteMany({_id: sessionId, userId});

        // Format and send a response
        const data = {success: true, message: 'Successfully retrieved availabilities', content: {availabilities, sessionId: newSession._id}};
        sendFormattedJSON(data, res);
    }
    catch (e)
    {
        handleError(e, res, true, false, true);
    }
})

module.exports = router;
