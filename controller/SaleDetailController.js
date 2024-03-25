const mongoose = require("mongoose");
const Image = require("../Schema/ImageSchema");
const Sale = require("../Schema/SaleDetailSchema");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const getSaleDetail = async (req, res) => {
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
    const sale = await Sale.find({ userId: userId });
    if (sale.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No sales found for this user",
      });
    }
    res.status(200).json({
      success: true,
      sale,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getSaleDetail,
  };