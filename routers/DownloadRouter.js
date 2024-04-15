const express = require("express");
const router = require("express").Router();
const { downloadImage } = require("../controller/DownloadController");

router.post("/downloadImage", downloadImage);

module.exports = router;
