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
    createTime:{
        type: Date,
        default: Date.now,
        expires: 600
    }
})

module.exports = mongoose.model("Token", tokenSchema);