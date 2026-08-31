import { v2 as cloudinary } from 'cloudinary';
import { ENV } from '../config/env.js';

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
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        if (!result) {
          return reject(new Error('Cloudinary upload returned no result.'));
        }
        resolve(result.secure_url);
      }
    );

    // Write buffer to stream and end
    uploadStream.end(fileBuffer);
  });
}
