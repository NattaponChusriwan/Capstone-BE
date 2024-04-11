const express = require("express");
const router = require("express").Router();
const User = require("../Schema/UserSchema");
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
    })
    res.status(200).json({ tokenId: card.id });
   
  } catch (error) {
    console.error("Error creating card:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  tokenCard,
};
