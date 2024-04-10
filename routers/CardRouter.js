const express = require("express");
const router = require("express").Router();
const { tokenCard} = require("../controller/CardController");


router.post("/tokenCard", tokenCard);

module.exports = router;