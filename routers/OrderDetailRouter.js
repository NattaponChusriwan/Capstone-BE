const express = require("express");
const router = require("express").Router();
const { getOrder } = require("../controller/OrderDeatilController");

router.get("/", getOrder);


module.exports = router;
