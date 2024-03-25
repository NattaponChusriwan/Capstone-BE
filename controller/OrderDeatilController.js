const mongoose = require("mongoose");
const Image = require("../Schema/ImageSchema");
const Order = require("../Schema/OrderDetailSchema");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const getOrder = async (req, res) => {
  try {
    const secretKey = process.env.ACCESS_TOKEN_SECRET;
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }
    const actualToken = token.split(" ")[1];
    const decodedTokenExpire = jwt.decode(actualToken);
    if (decodedTokenExpire.exp < Date.now() / 1000) {
      return res.status(401).json({ error: "Token expired" });
    }
    const decoded = jwt.verify(actualToken, secretKey);
    const userId = decoded.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    
    const order = await Order.find({ userId: userId })
    if (order.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No order found for this user",
      });
    }
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
    getOrder,
  };