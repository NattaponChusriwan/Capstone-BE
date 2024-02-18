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
const nodemailer = require("nodemailer");
const Token = require("../Schema/TokenSchema");
const crypto = require("crypto");
const sendEmail = require("../middleware/sendEmail");
const registerUser = async (req, res) => {
  try {
      const { email, username, password } = req.body;

      const emailLower = email.toLowerCase();

      if (!(emailLower && username )) {
          return res.status(400).send("All input is required");
      }

      if (!validator.isEmail(emailLower)) {
          return res.status(400).send("Email is not valid");
      }

      if (!validator.isLength(username, { min: 6, max: 20 })) {
          return res.status(400).send("Username is not valid");
      }

      if (!validator.isStrongPassword(password)) {
          return res.status(400).send("Password is not valid");
      }

      const encryptedPassword = await bcrypt.hash(password, 10);

      const oldUser = await User.findOne({ email: emailLower, username });
      if (oldUser) {
          return res.status(400).send("User Already Exists. Please Login Again");
      }

      const newUser = new User({
          email: emailLower,
          password: encryptedPassword,
          username,
      })
      await newUser.save(); 

      let token =  new Token({
        userId: newUser._id,
        token: jwt.sign({userId: newUser._id}, process.env.ACCESS_TOKEN_SECRET),
      });
      await token.save();
      const url = `${process.env.BASE_URL}/user/verify/${newUser._id}/${token.token}` 
      console.log(url)
      await sendEmail(newUser.email,"Verify your email",url)
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
      const user = await User.findOne({ email: emailLower });
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      if(!user.isVerified){
        return res.status(403).json({ success: false, message: "Please verify your email" });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: "Invalid password" });
      }
      const access_token = jwtGenerate(user);
      const refresh_token = jwtRefreshTokenGenerate(user);
      // Save the refresh token to the user document in your database or another secure location
      user.refresh = refresh_token;
      await user.save();
      res.status(200).json({
        success: true,
        message: "Login successful",
        user,
        token: access_token,
        refresh_token,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Error during login" });
    }
  };
  const refreshTokens = async (req, res) => {
    try {
      const { token } = req.body;
      jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
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
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error during token refresh" });
    }
  };
  const updateUser = async (req, res) => {
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
  
      // Use decoded.userId directly in the comparison
      if (updateUser._id.toString() !== decoded.userId) {
        return res.status(401).json({
          success: false,
          message: "You don't have permission",
        });
      }
  
      let newDownloadURL = updateUser.profile_image; // Use the existing image URL by default
  
      if (req.file) {
        // Image upload logic (update with your actual implementation)
        const imageBuffer = req.file.buffer;
        const newFilename = `${Date.now()}_${req.file.originalname}`;
        // Update these functions with your actual Firebase Storage methods
        const newFileRef = ref(storage, `images/profile/${newFilename}`);
        await uploadBytesResumable(newFileRef, imageBuffer, { contentType: req.file.mimetype });
        newDownloadURL = await getDownloadURL(newFileRef);
  
        // Delete old profile image from storage if it exists
        if (updateUser.profile_image) {
          const imageRef = ref(storage, updateUser.profile_image);
          await deleteObject(imageRef);
        }
      }
  
      const encryptedPassword = await bcrypt.hash(req.body.password, 10);
  
      const updateData = {
        email: req.body.email,
        username: req.body.username,
        password: encryptedPassword,
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
        message: "Profile updated successfully",
        updatedUser,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Error updating profile",
      });
    }
  };
  const verifyEmail = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id });
        if (!user) return res.status(400).send("Invalid link");

        const token = await Token.findOne({
            userId: user._id,
            token: req.params.token,
        });
        if (!token) return res.status(400).send("Invalid link");

        user.isVerified = true;
        user.emailVerificationExpires = null; // Set emailVerificationExpires to null
        await user.save();
        await token.deleteOne(token._id);

        res.redirect('http://capstone23.sit.kmutt.ac.th/tt2/');
    } catch (error) {
        res.status(400).send("An error occurred");
    }
};
  const forgotPassword = async (req, res) => {
    try {
      const user = await User
      .findOne
      ({ email: req.body.email });
      console.log(user);
      if (!user) return res.status(400).send("User not found");
      let token = new Token({
        userId: user._id,
        token: jwt.sign({userId: user._id}, process.env.ACCESS_TOKEN_SECRET),
      });
      await token.save();
      const url = `${process.env.BASE_URL}/user/reset/${user._id}/${token.token}`;
      console.log(url);
      await sendEmail(user.email, "Reset your password", url);
      res.send("Password reset link sent to your email account");
    }
    catch (error) {
      res.status(400).send("An error occured");
    }
  }

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
}

  module.exports = {
    registerUser,loginUser,refreshTokens,updateUser,verifyEmail,forgotPassword,resetPassword,refreshTokens
  };