const express = require('express');
const mongoSanitize = require('mongo-sanitize');
const fs = require('fs');
const router = express.Router();
const { handleError, validLogsPassword } = require('../lib/valiant-lib');
const Log = require('../models/Log');

router.route('/').post((req, res) => {
    /*Log.find()
        .then(logs => {
            res.json({success: true, message: 'All logs in content.logs', content: {logs: logs}});
        })
        .catch(err => handleError(err, res));*/
});

router.route('/export').post((req, res) => {
    //const filename = mongoSanitize( req.body.filename );
    const password = req.body.password === undefined ? '' : mongoSanitize( req.body.password );
    const date = new Date();

    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDay();

    year = (year < 10 ? '0' + year : year);
    month = (month < 10 ? '0' + month : month);
    day = (day < 10 ? '0' + day : day);

    const dateString = day + '-' + month + '-' + year;
    const filename = process.env.LOGS_FILENAME + dateString + '.txt';

    validLogsPassword(password)
        .then(valid => {
            if (valid)
            {
                Log.find()
                    .then(logs => {
                        fs.appendFile(filename, logs.toString(), (err) => {
                            if (err)
                            {
                                handleError(err, res);
                            }
                            else
                            {
                                const message = 'Admn successfully exported logs to file ' + filename;

                                Log.deleteMany()
                                    .then(() => {
                                        res.json({success: true, message: message});
                                        console.log(message);
                                    })
                                    .catch(err => handleError(err));
                            }
                        });
                    })
                    .catch(err => handleError(err));
            }
            else
            {
                handleError('Someone tried exporting your logs with the following password: ' + password, res);
            }
        })
        .catch(err => handleError(err));
    
});

module.exports = router;
