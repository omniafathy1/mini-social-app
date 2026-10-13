const multer = require("multer");

// بنخزن الملف في الـ RAM مؤقتًا (buffer) مش على الهارد ديسك،
// لأننا هنبعته على طول لـ Cloudinary وملناش داعي نحتفظ بيه على السيرفر أصلاً
const storage = multer.memoryStorage();

// بنرفض أي ملف مش صورة (زي .pdf أو .exe) قبل ما نضيع وقت في رفعه
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 ميجا حد أقصى للصورة
});

module.exports = upload;