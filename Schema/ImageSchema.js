const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    userId: {
        type: String
    },
    title : {   
        type: String
    },
    description: {
        type: String
    },
    image: {
        type: String
    },
    sale : {    
        type: Boolean
    },
    price: {
        type: Number
    },  
    category: {
        type: String
    },
    uploadTime: {
        type: Date,
        default: Date.now
    },
    updateTime: {
        type: Date,
        default: Date.now
    }   });

module.exports = mongoose.model('Image', imageSchema);
