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
   
    const card = await omiseClient.tokens.create({
      card: {
        name: req.body.name,
        number: req.body.number,
        expiration_month: req.body.expiration_month,
        expiration_year: req.body.expiration_year,
        security_code: req.body.security_code,
      },
    });
    const existingCard = await Card.findOne({ userId: userId, number: req.body.number });
    if (existingCard) {
      const isSameCardData = (
        existingCard.name === req.body.name &&
        existingCard.expiration_month === req.body.expiration_month &&
        existingCard.expiration_year === req.body.expiration_year
      );
      if (isSameCardData) {
        return res.status(200).json({ message: "Card data is the same. No update needed.", tokenId: card.id });
      } else {
        await Card.findOneAndUpdate(
          { userId: userId, number: req.body.number },
          {
            name: req.body.name,
            expiration_month: req.body.expiration_month,
            expiration_year: req.body.expiration_year,
            updateAt: Date.now()
          }
        );
        return res.status(200).json({ message: "Card updated successfully", tokenId: card.id });
      }
    }
    const cardSave = new Card({
      userId: userId,
      name: req.body.name,
      number: req.body.number,
      expiration_month: req.body.expiration_month,
      expiration_year: req.body.expiration_year,
      cardId: card.card.id,
    });
    await cardSave.save();

    await User.findByIdAndUpdate(userId, { $addToSet: { cardId: card.card.id } });
    
    res.status(200).json({ tokenId: card.id });
   
  } catch (error) {
    console.error("Error creating card:", error);
    res.status(500).json({ error: error.message });
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
    if (card.length === 0) {
      return res.status(404).json({ error: "No card found for this user" });
    }
    res.status(200).json(card);
  } catch (error) {
    console.error("Error getting card:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  tokenCard,
  getCard,
};
