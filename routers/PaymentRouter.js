const express = require("express");
const router = require("express").Router();
const { charge,promptpay,webhooks,getWebhookStatus } = require("../controller/PaymentController");

router.post("/charge", charge);
router.post("/promptpay", promptpay);
router.post("/webhooks", webhooks);
router.get("/webhookStatus", getWebhookStatus);

module.exports = router;

