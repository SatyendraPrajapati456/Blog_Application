// middleware/upload.js
// Re-exports the Cloudinary-backed multer instances from config/cloudinary.js
// so any route can simply:  const { uploadCover, uploadAvatar } = require('./upload');

const { uploadCover, uploadAvatar } = require('../config/cloudinary');
module.exports = { uploadCover, uploadAvatar };
