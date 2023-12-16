const express = require("express");
const router = require("express").Router();
const {
  filterImages,
  getCategories,
} = require("../controller/CategoryController");

router.get("/", getCategories);
router.get("/filter", filterImages);

module.exports = router;
