const Image = require('../models/image.js');
const { uploadToCloudinary } = require('../helpers/cloudinaryHelper.js');
const fs = require('fs');
const cloudinary = require('../config/cloudinary.js')

const uploadImageController = async (req, res) => {
  try {
    //check if file is missing in req object
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "file is required please upload an image"
      });
    }

    //upload to cloudinary
    const { url, publicId } = await uploadToCloudinary(req.file.path);

    //store the image url and public id along with the uploaded user id in database
    const newlyUploadedImage = new Image({
      url,
      publicId,
      uploadedBy: req.userInfo.userId
    });

    await newlyUploadedImage.save();

    //delete the file from local storage
    fs.unlinkSync(req.file.path) //-> iise  image local storage me nahi aayega lekin server me aayega.

    res.status(201).json({
      success: true,
      message: "Image Uploaded Successfully",
      Image: newlyUploadedImage
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'SomeThing went Wrong.! please try again'
    })
  }
};

const fetchImagesController = async (req, res) => {
  try {
    //Doing Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const totalImages = await Image.countDocuments();
    const totalPages = Math.ceil(totalImages / limit);

    const sortObj = {};
    sortObj[sortBy] = sortOrder;

    const images = await Image.find().sort(sortObj).skip(skip).limit(limit);

    if(images){
      res.status(200).json({
        success: true,
        currentPage: page,
        totalPages: totalPages,
        totalImages: totalImages,
        data: images
      });
    }else{
      res.status(404).json({
        success: false,
        message: "No images Found!"
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'SomeThing went Wrong.! please try again'
    })
  }
}

const deleteImagesController = async (req, res) => {
  try {
    const getCurrentIdOfImgToDlt = req.params.id;
    const userId = req.userInfo.userId;

    const image = await Image.findById(getCurrentIdOfImgToDlt);

    if(!image){
      return res.status(404).json({
        success: false,
        message: "Image not found"
      });
    }

    // check if the image is uploaded by the Current user who is trying to delete.
    if(image.uploadedBy.toString() !== userId){
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this image coz u didn't upload it"
      });
    }

    //delete the image first from cloudinary storage
    await cloudinary.uploader.destroy(image.publicId);

    //delete the image from mongoDB database
    await Image.findByIdAndDelete(getCurrentIdOfImgToDlt);
    res.status(200).json({
      success: true,
      message: "mage deleted Successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'SomeThing went Wrong.! please try again'
    });
  }
}

module.exports = {
  uploadImageController,
  fetchImagesController,
  deleteImagesController
}