import { v2 as cloudinary } from 'cloudinary';
import { ENV } from '../config/env.js';

const UPLOAD_TIMEOUT_MS = 20_000;

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
    let settled = false;
    let uploadStream: ReturnType<typeof cloudinary.uploader.upload_stream> | undefined;
    const deadline = setTimeout(() => rejectUpload(), UPLOAD_TIMEOUT_MS);
    const rejectUpload = () => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      console.error('Cloudinary upload failed');
      reject(new MediaUploadError());
      uploadStream?.destroy();
    };

    try {
      uploadStream = cloudinary.uploader.upload_stream(
        { folder, timeout: UPLOAD_TIMEOUT_MS },
        (error, result) => {
          if (settled) return;
          if (error || !result?.secure_url) {
            rejectUpload();
            return;
          }
          settled = true;
          clearTimeout(deadline);
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
