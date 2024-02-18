const express = require("express");
const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const {registerUser,loginUser,updateUser,verifyEmail,forgotPassword,resetPassword,refreshTokens} = require("../controller/UserController");

router.post("/register",registerUser)
router.post("/login",loginUser)
router.post("/refresh-token",refreshTokens)
router.put("/",upload.single('image'),updateUser)
router.get("/verify/:id/:token",verifyEmail)
router.post("/forgot-password",forgotPassword)
router.post("/reset/:id/:token",resetPassword)

module.exports = router;
