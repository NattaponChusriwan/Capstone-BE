const express = require("express");
const router = require("express").Router();
const { getSales,getSaleDetail } = require("../controller/SaleDetailController");

router.get("/", getSales);
router.post("/getDetail", getSaleDetail);


module.exports = router;
