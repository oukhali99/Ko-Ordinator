const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    members: {
        type: Array,
        default: []
    },
    password: {
        type: String,
        required: true
    }
}, {
    timestamps: false
});

groupSchema.methods.generateHash = async function (password) {
    return await bcrypt.hash(password, parseInt(process.env.SALT_ROUND_COUNT));
};

groupSchema.methods.validPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
