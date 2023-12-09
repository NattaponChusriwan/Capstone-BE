const express = require("express");
const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const Image = require("../Schema/ImageSchema");
const Category = require("../Schema/CategorySchema");
const { initializeApp } = require("firebase/app");
const {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
  deleteObject,
} = require("firebase/storage");
const config = require("../config/firebase");
initializeApp(config.firebaseConfig);
const storage = getStorage();
const storageRef = ref(storage);

// router.get("/", async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 30;
//   const skip = (page - 1) * limit;
//   try {
//     const totalImages = await Image.countDocuments();
//     const findImages = await Image.find().skip(skip).limit(limit);

//     if (!findImages || findImages.length === 0) {
//       return res.json({
//         success: false,
//         message: "Images not found",
//       });
//     }
//     const AllImages = findImages.map((image) => ({
//       _id: image._id,
//       userId: image.userId,
//       title: image.title,
//       sales: image.sale,
//       description: image.description,
//       uploadTime: image.uploadTime,
//       images: image.image,
//       price: image.price,
//     }));

//     res.json({
//       success: true,
//       AllImages,
//       page,
//       totalPages: Math.ceil(totalImages / limit),
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(400).json({
//       success: false,
//       message: "Error fetching images",
//     });
//   }
// });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const imageBuffer = req.file.buffer;
    // Save image to Firebase
    const filename = `${Date.now()}_${req.file.originalname}`;
    const fileRef = ref(storageRef, `images/images/${filename}`);
    const metadata = { contentType: req.file.mimetype };
    await uploadBytesResumable(fileRef, imageBuffer, metadata);
    const downloadURL = await getDownloadURL(fileRef);

    let categoryID = null;
    const existingCategory = await Category.findOne({
      category: req.body.category,
    });

    if (existingCategory) {
      categoryID = existingCategory._id;
    } else {
      const newCategory = new Category({
        category: req.body.category,
      });
      const savedCategory = await newCategory.save();
      categoryID = savedCategory._id;
    }

    const image = new Image({
      userId: req.body.userId,
      title: req.body.title,
      description: req.body.description,
      image: downloadURL,
      sale: req.body.sale,
      price: req.body.price,
      category: categoryID,
    });

    const savedImage = await image.save();
    res.json({
      success: true,
      message: "Image saved successfully",
      savedImage,
    });
  } catch (err) {
    res.json({
      success: false,
      message: err,
    });
  }
});
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const objectId = req.params.id;
    const UpdateObject = await Image.findById(objectId);

    if (!UpdateObject) {
      return res.status(404).json({
        success: false,
        message: "Object not found",
      });
    }

    if (UpdateObject.userId !== req.body.userId) {
      return res.status(401).json({
        success: false,
        message: "You don't have permission",
      });
    }

    const imageBuffer = req.file.buffer;
    const newFilename = `${Date.now()}_${req.file.originalname}`;
    const newFileRef = ref(storage, `images/images/${newFilename}`);
    const metadata = { contentType: req.file.mimetype };
    await uploadBytesResumable(newFileRef, imageBuffer, metadata);
    const newDownloadURL = await getDownloadURL(newFileRef);
    let categoryID = null;
    const existingCategory = await Category.findOne({
      category: req.body.category,
    });

    if (existingCategory) {
      categoryID = existingCategory._id;
    } else {
      const newCategory = new Category({
        category: req.body.category,
      });
      const savedCategory = await newCategory.save();
      categoryID = savedCategory._id;
    }

    const updateData = {
      title: req.body.title,
      user_id: req.body.user_id,
      image: newDownloadURL,
      description: req.body.description,
      sales: req.body.sales,
      price: req.body.price,
      category: categoryID,
      updateTime: new Date(),
    };

    const updatedImage = await Image.findOneAndUpdate(
      { _id: req.params.id },
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: "File updated successfully",
      updatedImage,
    });

    if (res.status(200)) {
      const imageRef = ref(storage, UpdateObject.image);
      deleteObject(imageRef).then(() => {
        console.log("Delete success for update image");
      });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: "Error to update image",
    });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const objectId = req.params.id;
    const deletedObject = await Image.findOneAndDelete(objectId);
    if (!deletedObject) {
      return res.status(404).json({
        success: false,
        message: "Object not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Object deleted successfully",
    });
    if (res.status(200)) {
      const imageRef = ref(storage, deletedObject.image);
      deleteObject(imageRef).then(() => {
        console.log("Delete success for delete image");
      });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: "Error to delete image ",
    });
  }
});
module.exports = router;
