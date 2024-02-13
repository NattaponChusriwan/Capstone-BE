const mongoose = require("mongoose");
const Image = require("../Schema/ImageSchema");
const Category = require("../Schema/CategorySchema");

const filterImages = async (req, res) => {
  try {
    const categoryId = req.query.categoryId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;

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
    const totalImages = await Image.countDocuments();

    const filterImages = await Image.find({
      category: new mongoose.Types.ObjectId(categoryId),
    })
      .skip(skip)
      .limit(limit)
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

    const AllImages = filterImages.map((image) => ({
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
      AllImages,
      page,
      totalPages: Math.ceil(totalImages / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching images",
    });
  }
};
const getCategories = async (req, res) => {
  try {
    // Query the database to get all categories
    const categories = await Category.find();

    // Check if categories were found
    if (!categories || categories.length === 0) {
      return res.json({
        success: false,
        message: "Category not found",
      });
    }

    // Return the categories
    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
    });
  }
};

module.exports = { filterImages, getCategories };
