const express = require("express");
const router = require("express").Router();
const { tokenCard,getCard } = require("../controller/CardController");


router.post("/tokenCard", tokenCard);
router.get("/getCard", getCard);
module.exports = router;