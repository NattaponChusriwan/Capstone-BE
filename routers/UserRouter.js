const express = require("express");
const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const {registerUser,loginUser,updateUser,verifyEmail} = require("../controller/UserController");

router.post("/register",registerUser)
router.post("/login",loginUser)
router.put("/",upload.single('image'),updateUser)
router.get("/verify/:token",verifyEmail)

module.exports = router;
