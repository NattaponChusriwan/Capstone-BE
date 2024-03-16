const express = require("express");
const router = require("express").Router();
const { createPromptPayQRCode,createRecipient,createProduct,charge } = require("../controller/PaymentController");


// สร้าง endpoint สำหรับสร้างสินค้า
router.post("/createPromptPayQRCode", createPromptPayQRCode);
router.post("/createRecipient", createRecipient);
router.post("/createProduct", createProduct);
router.post("/charge", charge);
module.exports = router;

