const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadBase64Image(base64, folder = "menu") {
  const res = await cloudinary.uploader.upload(base64, { folder });
  return res.secure_url;
}

module.exports = { cloudinary, uploadBase64Image };
