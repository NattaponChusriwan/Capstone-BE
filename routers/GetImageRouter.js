const express = require("express");
const router = require("express").Router();
const Image = require("../Schema/ImageSchema");
const User = require("../Schema/UserSchema");

router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 8;
  const skip = (page - 1) * limit;
  try {
    const totalImages = await Image.countDocuments();
    const findImages = await Image.find()
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
    if (!findImages || findImages.length === 0) {
      return res.json({
        success: false,
        message: "No image",
      });
    }

    const AllImages = findImages.map((image) => ({
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

    res.json({
      success: true,
      AllImages,
      page,
      totalPages: Math.ceil(totalImages / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: "Error fetching images",
    });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const objectId = req.params.id;
    const uploadedImage = await Image.findById(objectId)
    .populate({
      path: "userId",
      select: "username",
    })
    .populate({
      path: "category",
      select: "category",
    });

    if (!uploadedImage) {
      return res.status(404).json({
        success: false,
        message: "Object not found",
      });
    }
    res.json({
      _id: uploadedImage._id,
      username: uploadedImage.userId ? uploadedImage.userId.username : null,
      title: uploadedImage.title,
      image: uploadedImage.image,
      description: uploadedImage.description,
      sale: uploadedImage.sale,
      price: uploadedImage.price,
      category: uploadedImage.category ? uploadedImage.category.category : null,
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
// router.get("/", async (req, res) => {
//   try {
//     const categoryId = req.query.categoryId;
//     if (!categoryId) {
//       return res.status(400).json({
//         success: false,
//         message: "Category ID parameter is missing",
//       });
//     }
//     if (!mongoose.Types.ObjectId.isValid(categoryId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid category ID",
//       });
//     }
//     const filterImages = await Image.find({
//       category: new mongoose.Types.ObjectId(categoryId),
//     });
//     if (!filterImages || filterImages.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Images not found for the given category ID",
//       });
//     }
//     return res.json({
//       success: true,
//       filterImages,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching images",
//     });
//   }
// });
module.exports = router;
