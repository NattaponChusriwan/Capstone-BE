const express = require("express");
const router = require("express").Router();
const Image = require("../Schema/ImageSchema");
const Category = require("../Schema/CategorySchema");
const User = require("../Schema/UserSchema");
const mongoose = require("mongoose");
const Order = require("../Schema/OrderDetailSchema");
const Sale = require("../Schema/SaleSchema");
const Omise = require("omise");
const jwt = require("jsonwebtoken");
const SaleDetail = require("../Schema/SaleDetailSchema");
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
const {sendConfirmationPayment} = require("../middleware/sendEmail");

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
    const user = await User.findById(userId);

    const { imageId } = req.body;
    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }
    const seller = await User.findById(image.userId);
    const charge = await omiseClient.charges.create({
      amount: image.price * 100,
      currency: "THB",
      recipient: image.recipientId,
      card: req.body.cardToken,
    });
    if(charge.failure_code !=  null){
      const capitalizedError = charge.failure_message.charAt(0).toUpperCase() + charge.failure_message.slice(1);
      return res.status(402).json({ error: capitalizedError});
    }
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
      seller: seller.username,
      title: image.title
    });

    const savedOrder = await order.save();
   
    const sale = await Sale.findOneAndUpdate(
      { imageId: imageId },
      { $inc: { amount: 1, total: image.price * 0.9 } },
      { new: true, upsert: true }
    );
    const saleDeatil = new SaleDetail({
      imageId: imageId,
      price: image.price,
      buyerName: user.username
    });
    await saleDeatil.save();
    sendConfirmationPayment(user.email, newDownloadURL);
    res.status(200).json({ charge, transfer, savedOrder});
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ error: error.message });
  }
};
let promptpayProductId = {}
let user = {}
const promptpay = async (req, res) => {
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
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 5);
    const charge = await omiseClient.charges.create({
      amount: image.price * 100,
      currency: "THB",
      source: {
        type: "promptpay"
      },
      expires_at: expirationDate.toISOString(), 
    });
    promptpayProductId = imageId
    console.log("promptpayProductId", promptpayProductId)
    user = userId
    res.status(200).json({
      Qr_uri: charge.source.scannable_code.image.download_uri,
      expires_at: charge.expires_at
  });
  
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ error: error.message });
  }
}
let webhookStatus = null
const webhooks = async (req, res) => {
  try {
    const { data, key } = req.body;
    const image = await Image.findById(promptpayProductId);
    const userId = await User.findById(user);
    const seller = await User.findById(image.userId);
    if (key === "charge.complete") {
      webhookStatus = data.status
      console.log("Webhook received:", webhookStatus)
    }
    if (data.status === "successful" && data.source.scannable_code.type === "qr") {
      if (!image) {
        return res.status(404).json({ error: "Is not qr" });
      }
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
    const fileRef = ref(storage, `images/images/${user}/${newFilename}`);

    await uploadBytes(fileRef, convertedImageBuffer, {
      contentType: "image/jpeg",
    });

    const newDownloadURL = await getDownloadURL(fileRef);
    const order = new Order({
      userId: user,
      image: newDownloadURL,
      price: image.price,
      status: data.status,
      seller: seller.username,
      title: image.title
    });

    const savedOrder = await order.save();
   
    const sale = await Sale.findOneAndUpdate(
      { imageId: promptpayProductId },
      { $inc: { amount: 1, total: image.price * 0.9 } },
      { new: true, upsert: true }
    );
    const saleDeatil = new SaleDetail({
      imageId: promptpayProductId,
      price: image.price,
      buyerName: userId.username
    });
    await saleDeatil.save();
    
    sendConfirmationPayment(userId.email, newDownloadURL);
      res.status(200).json({ charge, transfer, savedOrder });
      return;
    }
    if (data.status === "failed") {
      res.status(400).json("Failed");
      return;}
    if(data.status === "expired"){
      res.status(400).json("Qr code expired");
      return;
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: error.message });
  }
}
const getWebhookStatus = async (req, res) => {
  if(webhookStatus === null){
    res.status(402).json({message : "No payment yet"});
  }
  if(webhookStatus === "successful"){
    res.status(200).json({message : "Payment successful"});
  }
  if(webhookStatus === "expired"){
    res.status(402).json({message : "Payment expired"});
  }
  if(webhookStatus === "failed"){
    res.status(402).json({message : "Payment failed"});
  }
  webhookStatus = null
}

module.exports = {
  charge,promptpay, webhooks,getWebhookStatus
};
