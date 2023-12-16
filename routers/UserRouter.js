const express = require("express");
const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const {registerUser,loginUser,updateUser,} = require("../controller/UserController");

router.post("/register",registerUser)
router.post("/login",loginUser)
router.put("/",upload.single('image'),updateUser)


module.exports = router;
