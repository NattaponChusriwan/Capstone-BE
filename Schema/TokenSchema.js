const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    token: {
        type: String,
        required: true,
    },
    createAt:{
        type: Date,
        default: Date.now,
        expires: 3600
    }
})
module.exports = mongoose.model("Token", tokenSchema);