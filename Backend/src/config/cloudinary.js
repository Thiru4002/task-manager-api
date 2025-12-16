const cloudinary = require("cloudinary").v2;

if (!process.env.CLOUDINARY_URL) {
  throw new Error("CLOUDINARY_URL is missing");
}

// Cloudinary automatically reads CLOUDINARY_URL
cloudinary.config();

module.exports = cloudinary;
