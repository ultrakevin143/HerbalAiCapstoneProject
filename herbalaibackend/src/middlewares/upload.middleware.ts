import multer from 'multer';

// Use memory storage so we don't save files locally on disk
const storage = multer.memoryStorage();

// Define allowed mime types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
  fileFilter: (req, file, callback) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error('Invalid file format. Only JPEG, JPG, PNG, and WEBP images are allowed.'));
    }
  },
}).single('image'); // Expect a single file under the field name 'image'
