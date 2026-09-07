import multer from 'multer';
import type { RequestHandler } from 'express';

// Use memory storage so we don't save files locally on disk
const storage = multer.memoryStorage();

// Define allowed mime types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const parseImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
  fileFilter: (req, file, callback) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(Object.assign(new Error('Invalid file format. Only JPEG, JPG, PNG, and WEBP images are allowed.'), { code: 'INVALID_IMAGE_FORMAT' }));
    }
  },
}).single('image'); // Expect a single file under the field name 'image'

export const uploadImage: RequestHandler = (req, res, next) => {
  parseImage(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE';
      res.status(tooLarge ? 413 : 400).json({ status: 'error', message: tooLarge ? 'File size too large. Images must not exceed 5MB.' : 'Invalid image upload. Send one image in the image field.' });
      return;
    }
    if (error instanceof Error && 'code' in error && error.code === 'INVALID_IMAGE_FORMAT') {
      res.status(400).json({ status: 'error', message: error.message });
      return;
    }
    next(error);
  });
};
