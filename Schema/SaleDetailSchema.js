const mongoose = require("mongoose");

const saleDetailSchema = new mongoose.Schema({
  imageId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Image",
  },
  buyerName:{
    type:String
  },
  price: {
    type: Number,
  },
  createTime:{
    type: Date,
    default: Date.now,
  }
},
{ versionKey: false }
);

module.exports = mongoose.model("SaleDetail", saleDetailSchema);