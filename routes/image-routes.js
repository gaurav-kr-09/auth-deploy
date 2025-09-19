const express = require('express');
const authMiddleware = require('../middleware/auth-middleware.js');
const adminMiddleware = require('../middleware/admin-middleware.js');
const uploadMiddleware = require('../middleware/upload-middleware.js')
const {uploadImageController, fetchImagesController, deleteImagesController} = require('../controllers/image-controllers.js')

const router = express.Router()

//Upload The image
router.post(
  '/upload', 
  authMiddleware,
  adminMiddleware,
  uploadMiddleware.single('image'),
  uploadImageController
);

// to get all the images
router.get('/get', authMiddleware, fetchImagesController);

//to delete image 
router.delete('/delete/:id', authMiddleware, adminMiddleware, deleteImagesController);

module.exports = router;