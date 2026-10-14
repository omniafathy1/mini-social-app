const multer = require("multer");

// Keep uploads in memory for direct Cloudinary upload; no local files are written.
const storage = multer.memoryStorage();

// Reject non-image uploads before sending them to Cloudinary.
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB maximum.
});

module.exports = upload;