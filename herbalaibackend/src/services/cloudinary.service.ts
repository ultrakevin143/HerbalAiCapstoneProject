import { v2 as cloudinary } from 'cloudinary';
import { ENV } from '../config/env.js';

export class MediaUploadError extends Error {
  readonly code = 'MEDIA_UPLOAD_UNAVAILABLE';

  constructor() {
    super('Image upload is temporarily unavailable. Please try again later.');
  }
}

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
  api_key: ENV.CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer directly to Cloudinary.
 * 
 * @param fileBuffer - The buffer of the file to upload
 * @param folder - Cloudinary folder name (defaults to 'herbal_ai_suggestions')
 * @returns The secure public URL of the uploaded image
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string = 'herbal_ai_suggestions'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const rejectUpload = () => {
      console.error('Cloudinary upload failed');
      reject(new MediaUploadError());
    };

    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error || !result?.secure_url) {
            rejectUpload();
            return;
          }
          resolve(result.secure_url);
        }
      );

      uploadStream.on('error', rejectUpload);
      uploadStream.end(fileBuffer);
    } catch {
      rejectUpload();
    }
  });
}
