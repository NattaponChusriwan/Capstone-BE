const Image = require("../Schema/ImageSchema");
const User = require("../Schema/UserSchema");

const getPaginatedImages = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;
  
    try {
      // Query the database to get paginated images
      const totalImages = await Image.countDocuments();
      const findImages = await Image.find()
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
  
      // Check if images were found
      if (!findImages || findImages.length === 0) {
        return res.json({
          success: false,
          message: 'No images found',
        });
      }
  
      // Map and format the paginated images
      const AllImages  = findImages.map((image) => ({
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
  
      // Return the paginated images along with pagination details
      res.json({
        success: true,
        AllImages ,
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
  const getImage = async (req, res) => {
    try {
      const objectId = req.params.id;
  
      // Query the database to get the image by ID
      const uploadedImage = await Image.findById(objectId)
        .populate({
          path: 'userId',
          select: 'username',
        })
        .populate({
          path: 'category',
          select: 'category',
        });
  
      // Check if the image was found
      if (!uploadedImage) {
        return res.status(404).json({
          success: false,
          message: 'Image not found',
        });
      }
  
      // Format the response
      const formattedImage = {
        _id: uploadedImage._id,
        username: uploadedImage.userId ? uploadedImage.userId.username : null,
        title: uploadedImage.title,
        image: uploadedImage.image,
        description: uploadedImage.description,
        sale: uploadedImage.sale,
        price: uploadedImage.price,
        category: uploadedImage.category ? uploadedImage.category.category : null,
        updateTime: uploadedImage.updateTime,
      };
  
      // Return the formatted image
      res.json(formattedImage);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Error fetching the image',
      });
    }
  };

  module.exports = { getPaginatedImages,getImage};