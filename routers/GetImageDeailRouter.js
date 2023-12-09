const express = require("express");
const router = require("express").Router();
const Image = require("../Schema/ImageSchema");
router.get("/:id", async (req, res) => {
    try {
      const objectId = req.params.id;
      const uploadedImage = await Image.findById(objectId);
  
      if (!uploadedImage) {
        return res.status(404).json({
          success: false,
          message: "Object not found",
        });
      }
      res.json({
        _id: uploadedImage._id,
        user_id: uploadedImage.userId,
        titel: uploadedImage.title,
        images: uploadedImage.image,
        description: uploadedImage.description,
        sales: uploadedImage.sale,
        price: uploadedImage.price,
        category: uploadedImage.category,
        updateTime: uploadedImage.updateTime,
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({
        success: false,
        message: "Error to get image",
      });
    }
  });
  module.exports = router;
