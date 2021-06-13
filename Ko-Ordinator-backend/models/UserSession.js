const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
    userId: {
        type: String,
        default: ''
    },
    deleted: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: new Date()
    }
}, {
    timestamps: false
});

const UserSession = mongoose.model('UserSession', userSessionSchema);

module.exports = UserSession;
