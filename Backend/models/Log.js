const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    userId : {
        type: String,
        unique: false,
        default: 'no-user'
    },
    message: {
        type: String,
        unique: false,
        default: ''
    }
}, {
    timestamps: true
});

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
