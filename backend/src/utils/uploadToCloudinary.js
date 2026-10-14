const cloudinary = require("../config/cloudinary");

async function uploadImageBuffer(buffer, mimetype) {
  const base64 = buffer.toString("base64");
  const dataUri = `data:${mimetype};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "social-app-posts",
  });

  return result.secure_url;
}

module.exports = { uploadImageBuffer };