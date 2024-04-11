const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  seller:{
    type: String,
  },
  image: {
    type: String,
  },
  title: {
    type: String,
  },
  price: {
    type: Number,
  },
  status: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
},
{ versionKey: false }
);

module.exports = mongoose.model("Order", orderSchema);
