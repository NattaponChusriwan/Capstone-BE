const express = require("express");
const router = require("express").Router();
const { getPaginatedImages,getImage,getPaginatedImagesByCategory} = require("../controller/GetImageController");

router.get("/", getPaginatedImages);
router.get("/:id", getImage);

module.exports = router;
