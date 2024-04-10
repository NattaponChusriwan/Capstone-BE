const mongoose = require("mongoose");

const saleDetailSchema = new mongoose.Schema({
  imageId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Image",
  },
  price: {
    type: Number,
  },
  createdAt:{
    type: Date,
    default: Date.now,
  }
},
{ versionKey: false }
);

module.exports = mongoose.model("SaleDetail", saleDetailSchema);