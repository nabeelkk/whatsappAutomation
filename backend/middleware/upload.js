const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Absolute path to uploads folder
const uploadDir = path.join(process.cwd(), "uploads");

// Auto-create uploads folder if missing
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

// Allowed extensions
const allowedExt = /\.(csv|xlsx|xls|jpg|jpeg|png|pdf|mp4|mp3)$/i;

// File filter
const fileFilter = (req, file, cb) => {
  const extOk = allowedExt.test(file.originalname.toLowerCase());

  if (!extOk) {
    return cb(
      new Error("Invalid file type. Allowed: CSV, Excel, Images, PDF, Video, Audio")
    );
  }

  cb(null, true);
};

// Export multer
module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
});
