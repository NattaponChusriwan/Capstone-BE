const fs = require("fs");
const fetch = require("node-fetch");
const Image = require("../Schema/ImageSchema");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const downloadImage = async (req, res) => {
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

    const imageUrl = req.body.url;
    const title = req.body.title;
    const outputPath = `${Date.now()}.jpg`;
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch the image");
    }

    const fileStream = fs.createWriteStream(outputPath);
    await new Promise((resolve, reject) => {
      response.body.pipe(fileStream);
      response.body.on("error", reject);
      fileStream.on("finish", resolve);
    });
    res.download(outputPath, `${title}.jpg`, (err) => {
      fs.unlink(outputPath, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Error removing temporary file:", unlinkErr);
        }
      });

      if (err) {
        console.error("Error sending file:", err);
        res.status(500).json({
          success: false,
          message: "Error sending file",
        });
      }
    });
  } catch (error) {
    console.error("Error downloading image:", error);
    res.status(500).json({
      success: false,
      message: "Error downloading image",
    });
  }
};

module.exports = {
  downloadImage,
};
