const express = require("express");
const router = require("express").Router();
const { webhook } = require("../controller/WebhookController");

router.post("/", webhook);

module.exports = router;