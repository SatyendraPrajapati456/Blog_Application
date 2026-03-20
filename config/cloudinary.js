const cloudinary = require('cloudinary');
const cloudinaryStorage = require('multer-storage-cloudinary');
const multer = require('multer');

// ── Configure Cloudinary ──────────────────────────────────────────────────────
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Warn at startup if credentials are missing ────────────────────────────────
const credsMissing =
  !process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name';

if (credsMissing) {
  console.warn('\x1b[33m⚠  Cloudinary credentials not set in .env — image uploads will fail.\x1b[0m');
  console.warn('\x1b[33m   Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET\x1b[0m');
}

// ── Blog cover image storage ──────────────────────────────────────────────────
const blogCoverStorage = cloudinaryStorage({
  cloudinary,
  params: {
    folder:          'nss-blog/covers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation:  [{ width: 1200, height: 630, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
  },
});

// ── User avatar storage ───────────────────────────────────────────────────────
const avatarStorage = cloudinaryStorage({
  cloudinary,
  params: {
    folder:          'nss-blog/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 300, height: 300, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' }],
  },
});

// ── Shared image-only file filter ─────────────────────────────────────────────
const imageFilter = (req, file, cb) => {
  const allowed = /image\/(jpeg|jpg|png|gif|webp)/;
  if (allowed.test(file.mimetype)) return cb(null, true);
  cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp).'));
};

// ── Multer instances ──────────────────────────────────────────────────────────
const uploadCover = multer({
  storage: blogCoverStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

// ── Safe URL extractor ────────────────────────────────────────────────────────
// multer-storage-cloudinary v4 sets req.file.path = Cloudinary secure_url.
// If credentials are wrong the upload throws before we get here.
// We double-check: only accept URLs that look like real Cloudinary URLs.
const getCloudinaryUrl = (file) => {
  if (!file) return null;
  const url = file.path || file.secure_url || '';
  // Must be a proper https Cloudinary URL
  if (url.startsWith('https://res.cloudinary.com/')) return url;
  // Fallback: try secure_url directly on the file object
  if (file.secure_url && file.secure_url.startsWith('https://')) return file.secure_url;
  return null; // reject temp paths / garbage values
};

// ── Delete helper ─────────────────────────────────────────────────────────────
const deleteImage = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('cloudinary')) return;
  try {
    const parts     = imageUrl.split('/');
    const uploadIdx = parts.indexOf('upload');
    if (uploadIdx === -1) return;
    const after    = parts.slice(uploadIdx + 1);
    const startIdx = /^v\d+$/.test(after[0]) ? 1 : 0;
    const publicId = after.slice(startIdx).join('/').replace(/\.[^.]+$/, '');
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

module.exports = { cloudinary, uploadCover, uploadAvatar, deleteImage, getCloudinaryUrl, credsMissing };
