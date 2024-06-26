const express = require("express");
const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const dotenv = require("dotenv");
dotenv.config();
const User = require("../Schema/UserSchema");
const { ImageAnnotatorClient } = require("@google-cloud/vision");
const client = new ImageAnnotatorClient({ keyFilename: "./config/key.json" });
const { jwtGenerate, jwtRefreshTokenGenerate } = require("../middleware/jwt");
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
const Token = require("../Schema/TokenSchema");
const {sendEmail} = require("../middleware/sendEmail");
const registerUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    const emailLower = email.toLowerCase();

    if (!(emailLower && username)) {
      return res.status(400).send("All input is required");
    }

    if (!validator.isEmail(emailLower)) {
      return res.status(400).send("Email is not valid");
    }

    if (!validator.isLength(username, { min: 6, max: 20 })) {
      return res.status(400).send("Username is not valid");
    }

    if (!validator.isStrongPassword(password, { min: 6 })) {
      return res.status(400).send("Password is not valid");
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const oldUser = await User.findOne({ email: emailLower });
    if (oldUser) {
      return res.status(400).send("User Already Exists. Please Login Again");
    }

    const newUser = new User({
      email: emailLower,
      password: encryptedPassword,
      username,
    });
    await newUser.save();

    let token = new Token({
      userId: newUser._id,
      token: jwt.sign({ userId: newUser._id }, process.env.ACCESS_TOKEN_SECRET),
    });
    await token.save();
    const url = `${process.env.BASE_URL}/api/user/verify/${newUser._id}/${token.token}`
    // const url = `http://localhost:8080/api/user/verify/${newUser._id}/${token.token}`;
    console.log(url);
    await sendEmail(newUser.email, "Verify your email", url);
    res.send("An Email sent to your account please verify");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error during registration" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailLower = email.toLowerCase();
    const findUser = await User.findOne({ email: emailLower });
    
    if (!findUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    if (!findUser.isVerified) {
      return res.status(403).json({ success: false, message: "Please verify your email" });
    }
    
    const isPasswordValid = await bcrypt.compare(password, findUser.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }
    
    const access_token = jwtGenerate(findUser);
    const refresh_token = jwtRefreshTokenGenerate(findUser);
    
    findUser.refresh = refresh_token;
    await findUser.save();
    const { password: hashedPassword, ...user } = findUser.toObject();
    
    res.status(200).json({
      success: true,
      message: "Login successful",
      user,
      access_token: access_token,
      refresh_token,
    });
  
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error during login" });
  }
};

const refreshTokens = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    jwt.verify(
      refresh_token,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) {
          return res.status(401).json({ error: "Invalid refresh token" });
        }
        const userId = decoded.userId;
        const user = await User.findOne({ _id: userId });
        if (!user) {
          return res.status(401).json({ error: "Unauthorized" });
        }
        const access_token = jwtGenerate(user);
        const refresh_token = jwtRefreshTokenGenerate(user);
        user.token = refresh_token;
        await user.save();
        return res.json({
          access_token,
          refresh_token,
        });
      }
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error during token refresh" });
  }
};
const updateUser = async (req, res) => {
  try {
    
    const secretKey = process.env.ACCESS_TOKEN_SECRET;
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }
    
    const actualToken = token.split(" ")[1];
    const decodedTokenExpire = jwt.decode(actualToken);
    
    if (decodedTokenExpire.exp < Date.now() / 1000) {
      return res.status(401).json({ error: "Token expired" });
    }
    
    const decoded = jwt.verify(actualToken, secretKey);
    const userId = decoded.userId;
    const findUser = await User.findById(userId);

    if (!findUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (findUser._id.toString() !== decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "You don't have permission",
      });
    }

    let newDownloadURL = findUser.profile_image;
    let username = findUser.username;
    if (req.body.username) {
      if (!validator.isLength(req.body.username, { min: 6, max: 20 })) {
        return res.status(400).send("Username is not valid");
      }
      username = req.body.username;
    }
    if (req.file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Only JPEG and PNG files are allowed",
      });
    }
      const imageBuffer = req.file.buffer;
      const [resultInappropriate] = await client.safeSearchDetection(
        req.file.buffer
      );
      const safeSearchAnnotation = resultInappropriate.safeSearchAnnotation;
      if (
        safeSearchAnnotation.adult === "VERY_LIKELY" ||
        safeSearchAnnotation.violence === "VERY_LIKELY" ||
        safeSearchAnnotation.medical === "VERY_LIKELY"
      ) {
        return res.status(400).json({
          success: false,
          message: "Image contains inappropriate content",
        });
      }
      const newFilename = `${Date.now()}_${req.file.originalname}`;
      const newFileRef = ref(
        storage,
        `images/profile/${findUser._id}/${newFilename}`
      );
      await uploadBytesResumable(newFileRef, imageBuffer, {
        contentType: req.file.mimetype,
      });
      newDownloadURL = await getDownloadURL(newFileRef);
      if (findUser.profile_image) {
        const imageRef = ref(storage, findUser.profile_image);
        await deleteObject(imageRef);
      }
    }

    let encryptedPassword = findUser.password;
    if (req.body.password) {
      encryptedPassword = await bcrypt.hash(req.body.password, 10);
    }

    const updateData = {
      username: username,
      password: encryptedPassword,
      profile_image: newDownloadURL,
      updateTime: new Date(),
    };

    const user = await User.findOneAndUpdate(
      { _id: decoded.userId },
      updateData,
      { new: true }
    );
    const { password, ...updateUser} = user.toObject();
    res.json({
      success: true,
      message: "Profile updated successfully",
      updateUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "error to update user",
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) return res.status(400).send("cannot find user");

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (!token) return res.status(400).send("Cannot find token");

    user.isVerified = true;
    user.emailVerificationExpires = null;
    await user.save();
    await token.deleteOne(token._id);
    res.redirect(`http://capstone23.sit.kmutt.ac.th/tt2/login`);
  } catch (error) {
    res.status(400).send("An error occurred");
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const emailLower = email.toLowerCase();
    const user = await User.findOne({ email: emailLower });

    if (!user) return res.status(400).send("User not found");
    let token = new Token({
      userId: user._id,
      token: jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET),
    });
    await token.save();
    const url = `${process.env.BASE_URL}/user/reset/${user._id}/${token.token}`;
    console.log(url);
    await sendEmail(user.email, "Reset your password", url);
    res.send("Password reset link sent to your email account");
  } catch (error) {
    res.status(400).send("An error occured");
  }
};
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!validator.isStrongPassword(password)) {
      return res.status(400).send("Password is not valid");
    }

    const user = await User.findOne({ _id: req.params.id });
    if (!user) return res.status(400).send("Invalid link");

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (!token) return res.status(400).send("Invalid link");

    const encryptedPassword = await bcrypt.hash(password, 10);
    const resetPassword = {
      password: encryptedPassword,
      updateTime: new Date(),
    };
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.params.id },
      resetPassword,
      { new: true }
    );
    console.log("Updated User:", updatedUser);
    await token.deleteOne(token._id);
    res.json({ message: "Password reset successfully", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(400).send("An error occurred");
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshTokens,
  updateUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshTokens,
};

