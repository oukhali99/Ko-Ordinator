const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const https = require('https');
const http = require('http')
const fs = require('fs');
const UserSession = require('./models/UserSession');
const { handleError } = require('./lib/valiant-lib');
mongoose.set('useFindAndModify', false);
require('dotenv').config();

const HOSTNAME = process.env.HOSTNAME;
const PORT = process.env.PORT;

const app = express();
const  useHttps = process.env.HTTPS === "true";
const privateKey = useHttps ? fs.readFileSync(process.env.SSL_KEY_FILE, 'utf8') : undefined;
const certificate = useHttps ? fs.readFileSync(process.env.SSL_CRT_FILE, 'utf8') : undefined;
const credentials = {key: privateKey, cert: certificate};

let mongoDBConnected = false;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex : true});
const connection = mongoose.connection;
connection.on("open", () => {
    console.log("MongoDB Connected");
    mongoDBConnected = true;

    // The code below runs every time interval to cleanup any expired sessions in the database
    setInterval(async () => {
        try
        {
            const sTimestampNow = (new Date()).getTime() / 1000;        
            const userSessions = await UserSession.find({deleted: false});

            userSessions.forEach(async (userSession, index) =>
            {
                const dateTimestamp = userSession.timestamp;
                const sTimestampUserSession = dateTimestamp.getTime() / 1000;
                const sDifference = sTimestampNow - sTimestampUserSession;
                const sDifferenceMax = process.env.APP_SESSION_TIMOUT_S;
                const sessionId = userSession._id;
                if (sDifference > sDifferenceMax)
                {
                    // Delete the session
                    const deletedSession = await UserSession.deleteOne({deleted: false, _id: sessionId});
                    console.log('Deleted session ' + sessionId);
                }
            })
        }
        catch (e)
        {
            handleError(e, undefined, true, false, true);
        }
    }, process.env.DATABASE_CLEANUP_INTERVAL_S * 1000);
})

// Set up Routers
const rootRouter = express.Router();
rootRouter.route('/').get((req, res) => {res.send(`HTTP is Running<br/>MongoDB Connected: ${mongoDBConnected}`)});
const userRouter = require('./routes/users');
const logRouter = require('./routes/logs');
const availabilitiesRouter = require('./routes/availabilities');
const friendsRouter = require('./routes/friends');
const groupsRouter = require('./routes/groups');

// Connect Routers and Modules to Express
app.use(express.json());
app.use(cors());
app.use('/', rootRouter);
app.use('/users', userRouter);
app.use('/logs', logRouter);
app.use('/availabilities', availabilitiesRouter);
app.use('/friends', friendsRouter);
app.use('/groups', groupsRouter);

// Make HTTP/HTTPS Listen
if (useHttps) {
    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(process.env.PORT);
}
else {
    const httpServer = http.createServer(credentials, app);
    httpServer.listen(process.env.PORT);
}

