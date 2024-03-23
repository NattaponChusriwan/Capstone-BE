const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
    sale: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
    },
    category: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    }],
    recipientId: {
      type: String,
    },
    uploadTime: {
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

module.exports = mongoose.model("Image", imageSchema);
