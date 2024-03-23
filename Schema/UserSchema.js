const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    username: {
      type: String,
    },
    profile_image: {
      type: String,
    },
    role: {
      type: String,
      default: "User",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationExpires: {
      type: Date,
      default: () => new Date(+new Date() +  10 * 60 * 1000) 
  },
    recipientId:{
      type: String,
      default: null
    },
    cardId:[{
      type: String,
      default: ""
    }],
    createTime: {
      type: Date,
      default: Date.now,
    },
    updateTime: {
      type: Date,
      default: Date.now,
    },
  },
  
  { versionKey: false }
);

module.exports = mongoose.model("User", userSchema);
