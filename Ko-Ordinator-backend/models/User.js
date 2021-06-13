const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    activationToken: {
        type: String,
        required: true
    },
    activated: {
        type: Boolean,
        required: true
    },
    hashedPassword: {
        type: String,
        required: true,
    },
    friends: {
        type: Array,
        default: []
    },
    friendRequests: {
        type: Array,
        default: []
    },
    availabilities: {
        type: Array,
        default: []
    },
    groups: {
        type: Array,
        default: []
    }
}, {
    timestamps: true
});

userSchema.methods.generateHash = async function (password) {
    return await bcrypt.hash(password, parseInt(process.env.SALT_ROUND_COUNT));
};

userSchema.methods.generateValidationToken = async function (word) {
    return await bcrypt.hash(word, 1);
};

userSchema.methods.validPassword = async function(password) {
    return await bcrypt.compare(password, this.hashedPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
