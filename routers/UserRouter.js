const express = require("express");
const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const mongoose = require("mongoose");
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

router.post("/register", async (req, res) => {
  try {
    const { email, phone, username, password } = req.body;

    if (!(email && phone && username && password)) {
      return res.status(400).send("All input is required");
    }

    if (!validator.isEmail(email)) {
      return res.status(400).send("Email is not valid");
    }

    const thaiMobileRegex = /^(\+66|0)-?([1-9]\d{8})$/;
    if (!thaiMobileRegex.test(phone)) {
      return res.status(400).send("Phone is not a valid Thai mobile number");
    }

    if (!validator.isLength(username, { min: 6, max: 20 })) {
      return res.status(400).send("Username is not valid");
    }

    if (!validator.isStrongPassword(password)) {
      return res.status(400).send("Password is not valid");
    }
    const encryptedPassword = await bcrypt.hash(req.body.password, 10);
    const oldUser = await User.findOne({ email, phone, username });
    if (oldUser) {
      return res.status(400).send("User Already Exist. Please Login Again");
    }

    // Assuming encryptedPassword is defined elsewhere in your code
    const newUser = new User({
      email: req.body.email,
      password: encryptedPassword,
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
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }
    const access_token = jwtGenerate(user);
    const refresh_token = jwtRefreshTokenGenerate(user);
    // Save the refresh token to the user document in your database or another secure location
    user.refresh = refresh_token;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: user,
      token: access_token,
      refresh_token: refresh_token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error during login" });
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

router.put("/", upload.single("image"), async (req, res) => {
  try {
    const secretKey = process.env.ACCESS_TOKEN_SECRET;
    const token = req.headers.authorization;
    const actualToken = token.split(" ")[1];
    const decoded = jwt.verify(actualToken, secretKey);
    const updateUser = await User.findById(decoded.userId);

    if (!updateUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Use decoded.user directly in the comparison
    if (updateUser.userId !== decoded.user) {
      return res.status(401).json({
        success: false,
        message: "You don't have permission",
      });
    }

    let newDownloadURL = updateUser.profile_image; // Use the existing image URL by default

    if (req.file) {
      // Image upload logic
      const imageBuffer = req.file.buffer;
      const newFilename = `${Date.now()}_${req.file.originalname}`;
      const newFileRef = ref(storage, `images/profile/${newFilename}`);
      const metadata = { contentType: req.file.mimetype };
      await uploadBytesResumable(newFileRef, imageBuffer, metadata);
      newDownloadURL = await getDownloadURL(newFileRef);

      // Delete old profile image from storage if it exists
      if (updateUser.profile_image !== null && updateUser.profile_image !== undefined) {
        const imageRef = ref(storage, updateUser.profile_image);
        await deleteObject(imageRef);
      }
    }

    const encryptedPassword = await bcrypt.hash(req.body.password, 10);

    const updateData = {
      email: req.body.email,
      username: req.body.username,
      password: encryptedPassword,
      phone: req.body.phone,
      profile_image: newDownloadURL,
      updateTime: new Date(),
    };

    const updatedUser = await User.findOneAndUpdate(
      { _id: decoded.userId },
      updateData,
      { new: true }
    );

    console.log("Updated User:", updatedUser);
    res.json({
      success: true,
      message: "File updated successfully",
      updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
    });
  }
});

router.post("/logout", async (req, res) => {
  try {
    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error during login" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error during login" });
  }
});
module.exports = router;
