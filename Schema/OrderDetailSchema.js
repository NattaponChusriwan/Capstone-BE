const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  sellerId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
  createAt: {
    type: Date,
    default: Date.now,
  },
},
{ versionKey: false }
);

module.exports = mongoose.model("Order", orderSchema);
