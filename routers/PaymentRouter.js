const express = require("express");
const router = require("express").Router();
const { charge } = require("../controller/PaymentController");

router.post("/charge", charge);


module.exports = router;

