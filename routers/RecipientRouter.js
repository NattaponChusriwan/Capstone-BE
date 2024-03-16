const express = require("express");
const router = require("express").Router();
const { createRecipient,updateRecipient,getRecipient } = require("../controller/RecipientController");


router.post("/createRecipient", createRecipient);
router.put("/updateRecipient", updateRecipient);
router.get("/getRecipient", getRecipient);
module.exports = router;

