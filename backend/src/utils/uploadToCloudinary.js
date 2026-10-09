const cloudinary = require("../config/cloudinary");

// بياخد الملف كـ buffer (زي ما جاله من multer) ويرفعه لـ Cloudinary
// وبيرجع الرابط (secure_url) اللي هنخزنه في الداتابيز
async function uploadImageBuffer(buffer, mimetype) {
  // Cloudinary بتقبل الصورة كـ "data URI" (نص فيه الصورة نفسها مشفرة base64)
  const base64 = buffer.toString("base64");
  const dataUri = `data:${mimetype};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "social-app-posts", // بينظملنا الصور في فولدر مخصص جوه Cloudinary
  });

  return result.secure_url;
}

module.exports = { uploadImageBuffer };