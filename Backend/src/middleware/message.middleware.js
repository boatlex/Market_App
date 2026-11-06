import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Documents
    "application/pdf",                                                        
    "application/msword",                                                     
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    // Audio Formats (.m4a, .mp3, .aac, etc.)
    "audio/m4a",
    "audio/x-m4a",
    "audio/mp4",
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/aac"
  ];

  
  if (
    file.mimetype.startsWith("image/") || 
    file.mimetype.startsWith("audio/") || 
    allowedMimeTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type! Only images, voice notes, PDFs, and Word docs are allowed."), false); 
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } 
});
