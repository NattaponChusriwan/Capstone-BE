const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

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
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationExpires: {
      type: Date,
      default: () => new Date(+new Date() +  10 * 60 * 1000) 
  },
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
