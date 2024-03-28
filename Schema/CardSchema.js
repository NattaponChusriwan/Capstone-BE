const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  cardId:{
    type: String,
  },
  name: {
    type: String,
  },
  number: {
    type: String,
  },
  expiration_month: {
    type: Number,
  },
  expired_year: {
    type: Number,
  },
  createAt: {
    type: Date,
    default: Date.now,
  },
  updateAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Card", CardSchema);
