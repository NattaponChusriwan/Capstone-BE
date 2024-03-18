const express = require("express");
const router = require("express").Router();
const { getSaleDetail } = require("../controller/SaleDetailController");

router.get("/", getSaleDetail);


module.exports = router;
