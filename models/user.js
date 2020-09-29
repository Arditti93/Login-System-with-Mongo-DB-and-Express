const mongoose = require('mongoose');

const user = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    passwordcheck: {
        type: String,
        required: true
    },
    admin: {
        type: Boolean,
        default: false
    }
});
module.exports = mongoose.model('user', user);