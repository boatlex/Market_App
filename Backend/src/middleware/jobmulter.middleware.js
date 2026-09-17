import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // 1. Allowed file types list
  const allowedMimeTypes = [
    "application/pdf",                                                        
    "application/msword",                                                     
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
  ];

  // 2. Check if the file is an image OR a permitted document type
  if (file.mimetype.startsWith("image/") || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file safely
  } else {
    cb(new Error("Invalid file type! Only images, PDFs, and Word documents are allowed."), false); 
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

export default upload;
