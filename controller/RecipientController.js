const express = require("express");
const router = require("express").Router();
const User = require("../Schema/UserSchema");
const Recipient = require("../Schema/RecipientSchema");
const Omise = require("omise");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
dotenv.config();
const omiseClient = new Omise({
  publicKey: process.env.OMISE_PUBLIC_KEY,
  secretKey: process.env.OMISE_SECRET_KEY,
});
const createRecipient = async (req, res) => {
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

    const recipient = await omiseClient.recipients.create({
      name: req.body.name,
      email: req.body.email,
      type: req.body.type,
      bank_account: {
        brand: req.body.brand,
        number: req.body.accountNumber,
        name: req.body.accountName,
      },
    });

    const recipientSave = new Recipient({
      userId: userId,
      email: req.body.email,
      name: req.body.name,
      type: req.body.type,
      bank_account: {
        brand: req.body.brand,
        number: req.body.accountNumber,
        name: req.body.accountName,
      },
      recipientId: recipient.id,
    });

    // Update user with recipient ID
    const updateRecipient = {
      recipientId: recipient.id,
    };

    const user = await User.findOneAndUpdate({ _id: userId }, updateRecipient, {
      new: true,
    });
    const savedRecipient = await recipientSave.save();
    res.status(200).json(savedRecipient);
  } catch (error) {
    console.error("Error creating recipient:", error);
    res.status(500).json({ error: "Failed to create recipient" });
  }
};
const updateRecipient = async (req, res) => {
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
    const findUser = await User.findById(userId);
    if (!findUser) {
      return res.status(404).json({ error: "User not found" });
    }
    const recipient = await omiseClient.recipients.update(
      findUser.recipientId,
      {
        name: req.body.name,
        email: req.body.email,
        type: req.body.type,
        bank_account: {
          brand: req.body.brand,
          number: req.body.accountNumber,
          name: req.body.accountName,
        },
      }
    );
    const updatedRecipient = await Recipient.findOneAndUpdate(
      { recipientId: recipient.id },
      {
        name: req.body.name,
        email: req.body.email,
        type: req.body.type,
        bank_account: {
          brand: req.body.brand,
          number: req.body.accountNumber,
          name: req.body.accountName,
        },
      },
      { new: true }
    );
    const updateRecipientId = {
      recipientId: recipient.id,
    };
    const user = await User.findOneAndUpdate(
      { _id: userId },
      updateRecipientId,
      {
        new: true,
      }
    );
    res.status(200).json(updatedRecipient);
  } catch (error) {
    console.error("Error updating recipient:", error);
    res.status(500).json({ error: "Failed to update recipient" });
  }
};
const getRecipient = async (req, res) => {
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
    const findUser = await User.findById(userId);
    if (!findUser) {
      return res.status(404).json({ error: "User not found" });
    }
    const recipient = await omiseClient.recipients.retrieve(findUser.recipientId);
    res.status(200).json(recipient);
  } catch (error) {
    console.error("Error fetching recipient:", error);
    res.status(500).json({ error: "Failed to fetch recipient" });
  }
};

module.exports = {
  createRecipient,
  updateRecipient,
  getRecipient

};
