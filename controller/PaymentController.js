const express = require("express");
const router = require("express").Router();
const Image = require("../Schema/ImageSchema");
const Category = require("../Schema/CategorySchema");
const User = require("../Schema/UserSchema");
const mongoose = require("mongoose");
const Order = require("../Schema/OrderDetailSchema");
const Sale = require("../Schema/SaleDetailSchema");
const Omise = require("omise");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const { initializeApp } = require("firebase/app");
const {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
  deleteObject,
  uploadBytes,
} = require("firebase/storage");
const config = require("../config/firebase");
initializeApp(config.firebaseConfig);
const storage = getStorage();
const storageRef = ref(storage);
const sharp = require("sharp");

const omiseClient = new Omise({
  publicKey: process.env.OMISE_PUBLIC_KEY,
  secretKey: process.env.OMISE_SECRET_KEY,
});
const charge = async (req, res) => {
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

    const { imageId } = req.body;
    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }
    console.log("image", image.price)
    const charge = await omiseClient.charges.create({
      amount: image.price * 100,
      currency: "THB",
      recipient: image.recipientId,
      card: req.body.cardToken,
    });
    const transfer = await omiseClient.transfers.create({
      amount: image.price * 100 * 0.9,
      currency: "THB",
      recipient: image.recipientId,
    });

    const firebaseUrl = image.image;
    const originalDownloadURL = await getDownloadURL(ref(storage, firebaseUrl));

    const response = await fetch(originalDownloadURL);
    const imageBuffer = await response.arrayBuffer();

    const sharp = require("sharp");
    const convertedImageBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 100 })
      .toBuffer();

    const newFilename = `${Date.now()}_${image.title}.jpg`;
    const fileRef = ref(storage, `images/images/${userId}/${newFilename}`);

    await uploadBytes(fileRef, convertedImageBuffer, {
      contentType: "image/jpeg",
    });

    const newDownloadURL = await getDownloadURL(fileRef);
    const order = new Order({
      userId: userId,
      image: newDownloadURL,
      price: image.price,
      status: charge.status,
      sellerId: image.userId,
    });

    const savedOrder = await order.save();
    const sale = await Sale.findOneAndUpdate(
      { imageId: imageId },
      { $inc: { amount: 1, total: image.price * 0.9 } },
      { new: true, upsert: true }
    );
  
    res.status(200).json({ charge, transfer, savedOrder });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
};

module.exports = {
  charge,
};
