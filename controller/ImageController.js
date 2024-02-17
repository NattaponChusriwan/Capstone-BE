const express = require("express");
const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const Image = require("../Schema/ImageSchema");
const Category = require("../Schema/CategorySchema");
const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
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
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const client = new ImageAnnotatorClient({ keyFilename: './config/key.json' });


const createImage = async (req, res) => {
  try {
    const secretKey = process.env.ACCESS_TOKEN_SECRET;
    const token = req.headers.authorization;
    const actualToken = token.split(' ')[1];
    const decoded = jwt.verify(actualToken, secretKey);
    const userId = decoded.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
      });
    }

    const imageBuffer = req.file.buffer;

    const [resultInappropriate] = await client.safeSearchDetection(req.file.buffer);
    const safeSearchAnnotation = resultInappropriate.safeSearchAnnotation;

    // Check if the image contains inappropriate content
    if (
      safeSearchAnnotation.adult === 'VERY_LIKELY' ||
      safeSearchAnnotation.violence === 'VERY_LIKELY' ||
      safeSearchAnnotation.medical === 'VERY_LIKELY' ||
      safeSearchAnnotation.racy === 'VERY_LIKELY'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Image contains inappropriate content',
      });
    }
    const [result] = await client.labelDetection(req.file.buffer);
    const labels = result.labelAnnotations;
    const tags = labels.map(label => label.description);
    console.log(`Labels: ${tags}`);
    const categoryIDs = [];
    const tagsToSave = tags.slice(0, 4);
    for (const tag of tagsToSave) {
      let categoryID = null;
      const existingCategory = await Category.findOne({
        category: tag,
      });

      if (existingCategory) {
        categoryID = existingCategory._id;
      } else {
        const newCategory = new Category({
          category: tag,
        });
        const savedCategory = await newCategory.save();
        categoryID = savedCategory._id;
      }
      categoryIDs.push(categoryID);
    }
console.log(categoryIDs);
    // Save image to Firebase
    const filename = `${Date.now()}_${req.file.originalname}`
    const fileRef = ref(storageRef, `images/images/${userId}/${filename}`);
    const metadata = { contentType: req.file.mimetype };
    await uploadBytesResumable(fileRef, imageBuffer, metadata);
    const downloadURL = await getDownloadURL(fileRef);

    const image = new Image({
      userId: userId,
      title: req.body.title,
      description: req.body.description,
      image: downloadURL,
      sale: req.body.sale,
      price: req.body.price,
      category: categoryIDs,
    });

    const savedImage = await image.save();
    res.json({
      success: true,
      message: 'Image saved successfully',
      savedImage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error saving the image',
    });
  }
};


  const updateImage = async (req, res) => {
    try {
      const objectId = req.params.id;
      const updateObject = await Image.findById(objectId);
  
      if (!updateObject) {
        return res.status(404).json({
          success: false,
          message: 'Object not found',
        });
      }

      const secretKey = process.env.ACCESS_TOKEN_SECRET;
      const token = req.headers.authorization;
      const actualToken = token.split(' ')[1];
      const decoded = jwt.verify(actualToken, secretKey);
      const userIdString = updateObject.userId.toString();
      console.log(decoded.userId, userIdString);

      if (userIdString !== decoded.userId) {
        return res.status(401).json({
          success: false,
          message: "You don't have permission",
        });
      }
  
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
        // image: newDownloadURL,
        description: req.body.description,
        sale: req.body.sales,
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
        message: 'File updated successfully',
        updatedImage,
      });
  
      // const imageRef = ref(storage, updateObject.image);
      // deleteObject(imageRef).then(() => {
      //   console.log("Delete success for update image");
      // });
  
    } catch (error) {
      console.error(error);
      res.status(400).json({
        success: false,
        message: 'Error updating image',
      });
    }
  };
  const deleteImage = async (req, res) => {
    try {
      const secretKey = process.env.ACCESS_TOKEN_SECRET;
      const objectId = req.params.id;
      const token = req.headers.authorization;
      const actualToken = token.split(' ')[1];
      const decoded = jwt.verify(actualToken, secretKey);
  
      // Assuming objectId has a userId property
      if (objectId.userId && objectId.userId !== decoded.userId) {
        return res.status(401).json({
          success: false,
          message: "You don't have permission",
        });
      }
  
      const deletedObject = await Image.findOneAndDelete(objectId);
      if (!deletedObject) {
        return res.status(404).json({
          success: false,
          message: 'Object not found',
        });
      }
  
      res.status(200).json({
        success: true,
        message: 'Object deleted successfully',
      });
  
      // Assuming storage and ref are properly set up
      const imageRef = ref(storage, deletedObject.image);
      deleteObject(imageRef).then(() => {
        console.log('Delete success for delete image');
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({
        success: false,
        message: 'Error deleting image',
      });
    }
  };
  const getUserImages = async (req, res) => {
    try {
      const secretKey = process.env.ACCESS_TOKEN_SECRET;
      const token = req.headers.authorization;
      const actualToken = token.split(' ')[1];
      const decoded = jwt.verify(actualToken, secretKey);
      const userId = decoded.userId;
  
      const userImage = await Image.find({ userId: userId })
        .populate({
          path: 'userId',
          select: 'username',
        })
        .populate({
          path: 'category',
          select: 'category',
        });
  
      if (!userImage || userImage.length === 0) {
        return res.json({
          success: false,
          message: 'Image not found',
        });
      }
  
      const userImages = userImage.map((image) => ({
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
        userImages,
      });
    } catch (err) {
      res.json({
        success: false,
        message: err,
      });
    }
  };
  module.exports = { createImage,updateImage,deleteImage,getUserImages };