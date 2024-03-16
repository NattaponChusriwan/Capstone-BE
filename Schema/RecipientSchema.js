const mongoose = require("mongoose");
const RecipientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    type: {
      type: String,
      default: "individual",
    },
    bank_account: {
      brand: {
        type: String,
      },
      number: {
        type: String,
      },
      name: {
        type: String,
      },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    recipientId: {
      type: String,
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

module.exports = mongoose.model("Recipient", RecipientSchema);
