const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email :{
        type: String
    },
    password: {
        type: String
    },
    username: {
        type: String
    },
    phone : {
        type: String
    },
    profile_image: {
        type: String
    },
    role: {
        type: String
    },
    uid : {
        type: String
    },
    createTime: {
        type: Date,
        default: Date.now
    },
    updateTime: {
        type: Date,
        default: Date.now
    }   });

module.exports = mongoose.model('User', userSchema);