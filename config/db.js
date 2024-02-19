const mongoose = require("mongoose");
const User = require("../Schema/UserSchema");
const { MONGO_URI } = process.env;

exports.connect = () => {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("Connect successfully"))
    .catch((err) => console.error(err));
};

setTimeout(async () => {
  await User.deleteMany({
    emailVerificationExpires: { $lt: new Date() },
    isVerified: false
  });
}, 60000);

