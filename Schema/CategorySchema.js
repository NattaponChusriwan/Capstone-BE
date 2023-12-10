const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    category: {
      type: String,
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Category", categorySchema);
