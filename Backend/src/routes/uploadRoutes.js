const express = require("express");
const upload = require("../middleware/upload");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/file", auth, upload.single("file"), (req, res) => {
  return res.status(200).json({
    status: "success",
    url: req.file.secure_url,
  });
});

module.exports = router;
