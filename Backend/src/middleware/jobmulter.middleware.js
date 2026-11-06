import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",                                                        
    "application/msword",                                                     
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
  ];


  if (file.mimetype.startsWith("image/") || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); 
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
