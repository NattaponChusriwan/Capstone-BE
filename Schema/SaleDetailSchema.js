const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  imageId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Image",
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
  amount: {
    type: Number,
    default: 0,
  },
  total:{
    type: Number,
    default: 0,
  }
},
{ versionKey: false }
);

module.exports = mongoose.model("Sale", saleSchema);