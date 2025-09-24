const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check if file is an image or video
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Please upload only images or videos'), false);
  }
};

// Small uploads (avatars): 5MB
const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Larger media uploads (posts): 10MB to match Cloudinary free tier limit
const uploadMedia = multer({
  storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5 // Maximum 5 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Please upload only images or videos'), false);
    }
  }
}).array('media', 5);

// Error handling middleware for file uploads
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum file size is 10MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files per upload.'
      });
    }
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Error uploading file'
    });
  }
  next();
};

// Function to upload file to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: 'auto',
      folder: 'snaptalk',
      ...options
    };

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// Function to delete file from Cloudinary
const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadMedia,
  uploadToCloudinary,
  deleteFromCloudinary,
  handleUploadErrors
};
