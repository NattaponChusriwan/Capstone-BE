const express = require("express");
const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Schema/UserSchema");
const {
  jwtGenerate,
  jwtRefreshTokenGenerate,
  jwtValidate,
  jwtRefreshTokenValidate,
} = require("../middleware/jwt");
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

router.post("/register", upload.single("image"), async (req, res) => {
  try {
    const { email, phone, username, password } = req.body;
    if (!(email && phone && username && password)) {
      res.status(400).send("All input is required");
    }
    const oldUser = await User.findOne({ email, phone, username });
    if (oldUser) {
      return res.status(400).send("User Already Exist. Please Login Again");
    }
    const imageBuffer = req.file.buffer;
    const encryptedPassword = await bcrypt.hash(req.body.password, 10); // Use req.body.password for hashing
    const filename = `${Date.now()}_${req.file.originalname}`;
    const fileRef = ref(storageRef, `images/profile/${filename}`);
    const metadata = { contentType: req.file.mimetype };
    await uploadBytesResumable(fileRef, imageBuffer, metadata);
    const downloadURL = await getDownloadURL(fileRef);

    const newUser = new User({
      email: req.body.email,
      password: encryptedPassword,
      profile_image: downloadURL,
      phone: req.body.phone,
      username: req.body.username,
    });
    await newUser.save();

    res.status(201).json({
      newUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error during login" });
  }
});
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const access_token = jwtGenerate(user);
    const refresh_token = jwtRefreshTokenGenerate(user);
    // Save the refresh token to the user document in your database or another secure location
    user.refresh = refresh_token;
    await user.save();
    res.status(200).json({
      message: "Login successful",
      user: user,
      token: access_token,
      refresh_token: refresh_token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error during login" });
  }
});
router.post("/refresh", jwtRefreshTokenValidate, async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.body.userId,
      username: req.body.username,
    });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Assuming you have a field in your User model to store the refresh token
    const userWithRefreshToken = await User.findOne({
      refresh: req.body.token,
    });

    if (!userWithRefreshToken) {
      return res.status(401).json({ error: "Unauthorized2" });
    }

    const access_token = jwtGenerate(user);
    const refresh_token = jwtRefreshTokenGenerate(user);

    // Update the refresh token in the user document
    userWithRefreshToken.refresh = refresh_token;
    await userWithRefreshToken.save();

    return res.json({
      access_token,
      refresh_token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error during token refresh" });
  }
});
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const userId = req.params.id;
    const updateUser = await User.findById(userId);
    if (!updateUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    if (updateUser.user_id !== req.body.user_id) {
      return res.status(401).json({
        success: false,
        message: "You don't have permission",
      });
    }
    const imageBuffer = req.file.buffer;
    const newFilename = `${Date.now()}_${req.file.originalname}`;
    const newFileRef = ref(storage, `images/profile/${newFilename}`);
    const metadata = { contentType: req.file.mimetype };
    await uploadBytesResumable(newFileRef, imageBuffer, metadata);
    const newDownloadURL = await getDownloadURL(newFileRef);

    const encryptedPassword = await bcrypt.hash(req.body.password, 10);

    const updateData = {
      email: req.body.email,
      username: req.body.username,
      password: encryptedPassword,
      phone: req.body.phone,
      profile_image: newDownloadURL,
      updateTime: new Date(),
    };

    if (res.status(200)) {
      const imageRef = ref(storage, updateUser.profile_image);
      deleteObject(imageRef).then(() => {
        console.log("Delete success for update image");
      });
    }
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.params.id },
      updateData,
      { new: true }
    );
    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: "Object not found",
      });
    } else {
      res.json({
        success: true,
        message: "File updated successfully",
        updatedUser,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: "Error to update user",
    });
  }
});
router.post('/logout',async (req, res) => {
  try {

    res.status(200).json({
      message: "Logout successful",
    });
  }catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error during login" });
  }
});
module.exports = router;
