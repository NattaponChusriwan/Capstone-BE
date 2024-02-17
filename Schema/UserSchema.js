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
// userSchema.methods.generateVerificationToken = function () {
//   const user = this;
//   const verificationToken = jwt.sign(
//     { _id: user._id },
//     process.env.VERIFICATION_TOKEN_SECRET,
//     { expiresIn: "1h" }
//   );
//   return verificationToken;
// };

module.exports = mongoose.model("User", userSchema);
