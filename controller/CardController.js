const express = require("express");
const router = require("express").Router();
const User = require("../Schema/UserSchema");
const Card = require("../Schema/CardSchema");
const Omise = require("omise");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
dotenv.config();
const omiseClient = new Omise({
  publicKey: process.env.OMISE_PUBLIC_KEY,
  secretKey: process.env.OMISE_SECRET_KEY,
});

const tokenCard = async (req, res) => {
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

    // Check if the card number already exists for the current user
    const existingCard = await Card.findOne({ userId: userId, number: req.body.number });

    // If the card number already exists for the current user, return the existing token
   

    const card = await omiseClient.tokens.create({
      card: {
        name: req.body.name,
        city: req.body.city,
        postal_code: req.body.postal_code,
        number: req.body.number,
        expiration_month: req.body.expiration_month,
        expiration_year: req.body.expiration_year,
        security_code: req.body.security_code,
      },
    });
    if (existingCard) {
      return res.status(200).json({ tokenId: card.id });
    }

    // Save the new card in the database
    const cardSave = new Card({
      userId: userId,
      name: req.body.name,
      number: req.body.number,
      expiration_month: req.body.expiration_month,
      expired_year: req.body.expiration_year,
      cardId: card.card.id,
    });
    await cardSave.save();

    // Update the user's cardId field
    await User.findByIdAndUpdate(userId, { $addToSet: { cardId: card.card.id } });

    res.status(200).json({ tokenId: card.id });
    // Return the token
   
  } catch (error) {
    console.error("Error creating card:", error);
    res.status(500).json({ error: "Failed to create card" });
  }
};

const getCard = async (req, res) => {
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

    const card = await Card.find({ userId: userId });
    res.status(200).json(card);
  } catch (error) {
    console.error("Error getting card:", error);
    res.status(500).json({ error: "Failed to get card" });
  }
};

module.exports = {
  tokenCard,
  getCard,
};
