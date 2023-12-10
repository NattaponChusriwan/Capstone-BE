const express = require("express");
const router = require("express").Router();
const Image = require("../Schema/ImageSchema");
const mongoose = require("mongoose");
const Category = require("../Schema/CategorySchema");

router.get("/", async (req, res) => {
  try {
    const category = await Category.find();
    if (!category || category.length === 0) {
      return res.json({
        success: false,
        message: "Category not found",
      });
    }
    res.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: "Error fetching images",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const categoryId = req.query.categoryId;
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID parameter is missing",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const filterImages = await Image.find({
      category: new mongoose.Types.ObjectId(categoryId),
    })
      .populate({
        path: "userId",
        select: "username",
      })
      .populate({
        path: "category",
        select: "category",
      });

    if (!filterImages || filterImages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Images not found for the given category ID",
      });
    }

    const filteredImage = filterImages.map((image) => ({
      _id: image._id,
      username: image.userId ? image.userId.username : null,
      title: image.title,
      sale: image.sale,
      description: image.description,
      image: image.image,
      price: image.price,
      category: image.category ? image.category.category : null,
      updateTime: image.uploadTime,
    }));

    return res.json({
      success: true,
      filteredImage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching images",
    });
  }
});

module.exports = router;
