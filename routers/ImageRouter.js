const express = require("express");
const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const {createImage,updateImage,deleteImage,getUserImages} = require("../controller/ImageController");

router.post('/', upload.single('image'), createImage);
router.put('/:id', updateImage);
router.delete('/', deleteImage);
router.get('/userImages', getUserImages);

module.exports = router;
