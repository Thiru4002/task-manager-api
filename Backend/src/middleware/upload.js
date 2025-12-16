const multer = require("multer");
const cloudinaryStorage = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary");

// Simple, stable storage
const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "taskmanager_uploads",
});

const upload = multer({ storage });

module.exports = upload;
