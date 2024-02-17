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
  const expiredUsers = await User.find({
      emailVerificationExpires: { $lt: new Date() },
      isVerified: false 
  });

  expiredUsers.forEach(async (user) => {
      await User.deleteOne({ _id: user._id });
  });
}, 60000);
