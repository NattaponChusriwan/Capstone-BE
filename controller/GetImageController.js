const Image = require("../Schema/ImageSchema");
const CryptoJS = require("crypto-js");
const dotenv = require("dotenv");
dotenv.config();

const secretKey = process.env.IMAGE_SECRET;
function cipherUrl(url) {
return CryptoJS.AES.encrypt(url, secretKey).toString();
}
const getPaginatedImages = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 8;
  const skip = (page - 1) * limit;
  const categoryIds = req.query.categoryId;

  try {
    let query = {};
    if (categoryIds && Array.isArray(categoryIds)) {
      query.category = { $in: categoryIds }; 
    } else if (categoryIds) {
      query.category = categoryIds; 
    }
    const totalImages = await Image.countDocuments(query);
    const findImages = await Image.find(query)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'userId',
        select: 'username',
      })
      .populate({
        path: 'category',
        select: 'category',
      });

    if (!findImages || findImages.length === 0) {
      return res.json({
        success: false,
        message: 'No images found',
      });
    }

    const AllImages = findImages.map((image) => ({
      _id: image._id,
      username: image.userId ? image.userId.username : null,
      title: image.title,
      sale: image.sale,
      description: image.description,
      recipientId: image.recipientId,
      image: cipherUrl(image.image),
      price: image.price,
      category: image.category,
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
    res.status(500).json({
      success: false,
      message: 'Error fetching paginated images',
    });
  }
};
function description(url){
  const byte = CryptoJS.AES.decrypt(url, secretKey);
  const originalText = byte.toString(CryptoJS.enc.Utf8);
  return originalText;
}
  const getImage = async (req, res) => {
    try {
      const objectId = req.params.id;
      const uploadedImage = await Image.findById(objectId)
        .populate({
          path: 'userId',
          select: 'username',
        })
        .populate({
          path: 'category',
          select: 'category',
        });
      if (!uploadedImage) {
        return res.status(404).json({
          success: false,
          message: 'Image not found',
        });
      }
      const formattedImage = {
        _id: uploadedImage._id,
        username: uploadedImage.userId ? uploadedImage.userId.username : null,
        title: uploadedImage.title,
        image: cipherUrl(uploadedImage.image),
        recipientId: uploadedImage.recipientId,
        description: uploadedImage.description,
        sale: uploadedImage.sale,
        price: uploadedImage.price,
        category: uploadedImage.category ? uploadedImage.category.category : null,
        updateTime: uploadedImage.updateTime,
      };
      res.json(formattedImage);
      const decryptedImageUrl = description(formattedImage.image);
      console.log(decryptedImageUrl)
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Error fetching the image',
      });
    }
  };

  module.exports = { getPaginatedImages,getImage};