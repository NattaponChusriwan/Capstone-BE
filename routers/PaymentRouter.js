const express = require("express");
const router = require("express").Router();
const { charge,promptpay,webhooks } = require("../controller/PaymentController");

router.post("/charge", charge);
router.post("/promptpay", promptpay);
router.post("/webhooks", webhooks);

module.exports = router;

