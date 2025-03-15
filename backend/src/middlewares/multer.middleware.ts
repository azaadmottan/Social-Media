import multer from "multer";
import path from "path";
import { ApiError } from "../utils/apiError.js";

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/temp/"); // Store avatars in uploads/avatars
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

// File filter to allow only images
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(
      new ApiError(400, "Only image files are allowed!"), 
      false
    );
  }
};

const upload = multer({ 
  storage, 
  fileFilter, 
  limits: { 
    fileSize: 5 * 1024 * 1024 
  } // Limit to 5MB 
});

export { upload };