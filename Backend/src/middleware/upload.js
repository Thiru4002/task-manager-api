const multer = require("multer");
const cloudinaryStorage = require("multer-storage-cloudinary");
const cloudinaryV2 = require("../config/cloudinary");

const storage = cloudinaryStorage({
  cloudinary: { v2: cloudinaryV2 }, // wrapper (already correct)
  params: {
    folder: "taskmanager_uploads",
    resource_type: "raw", // ✅ MUST be inside params
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = upload;
