const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

// Storage for PDFs
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/pdfs/"),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(12).toString("hex");
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

// Storage for cover images
const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/covers/"),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(12).toString("hex");
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed for book uploads"), false);
};

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed for cover uploads"), false);
};

// Upload book: cover image + PDF in one request
const uploadBook = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === "bookFile") cb(null, "uploads/pdfs/");
      else cb(null, "uploads/covers/");
    },
    filename: (req, file, cb) => {
      const unique = crypto.randomBytes(12).toString("hex");
      cb(null, `${unique}${path.extname(file.originalname)}`);
    }
  }),
  limits: { fileSize: 60 * 1024 * 1024 }, // 60MB max
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "bookFile" && file.mimetype !== "application/pdf") {
      return cb(new Error("Book file must be a PDF"), false);
    }
    if (file.fieldname === "coverImage" && !file.mimetype.startsWith("image/")) {
      return cb(new Error("Cover must be an image"), false);
    }
    cb(null, true);
  }
}).fields([
  { name: "coverImage", maxCount: 1 },
  { name: "bookFile", maxCount: 1 }
]);

module.exports = { uploadBook };
