import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { ENV } from '../config/environment.js';
import { IFileAttachment } from '../types/index.js';

// Configure Cloudinary if credentials exist
if (ENV.CLOUDINARY_CLOUD_NAME && ENV.CLOUDINARY_API_KEY && ENV.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
    api_key: ENV.CLOUDINARY_API_KEY,
    api_secret: ENV.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export class StorageService {
  static async uploadFile(file: Express.Multer.File): Promise<IFileAttachment> {
    const isCloudinaryConfigured = Boolean(
      ENV.CLOUDINARY_CLOUD_NAME && ENV.CLOUDINARY_API_KEY && ENV.CLOUDINARY_API_SECRET
    );

    // 1. Cloudinary Upload Path
    if (ENV.UPLOAD_STORAGE_TYPE === 'cloudinary' && isCloudinaryConfigured) {
      return new Promise((resolve, reject) => {
        const isPdf = file.mimetype === 'application/pdf';
        const resourceType = isPdf ? 'raw' : 'auto';
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'async_health_records',
            resource_type: resourceType,
            // 'authenticated' assets have no public URL; they are fetched server-side with a signed URL
            type: 'authenticated',
            public_id: `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
          },
          (error, result) => {
            if (error || !result) {
              return reject(error || new Error('Cloudinary upload failed'));
            }
            resolve({
              filename: result.public_id,
              originalName: file.originalname,
              mimeType: file.mimetype,
              sizeBytes: file.size,
              url: result.secure_url,
              publicCloudId: result.public_id,
              storageType: 'cloudinary',
              deliveryType: 'authenticated',
            });
          }
        );

        uploadStream.end(file.buffer);
      });
    }

    // 2. Local Fallback / Development Storage
    if (!fs.existsSync(ENV.UPLOAD_DIR)) {
      fs.mkdirSync(ENV.UPLOAD_DIR, { recursive: true });
    }

    const ext = path.extname(file.originalname);
    const uniqueFilename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const targetPath = path.join(ENV.UPLOAD_DIR, uniqueFilename);

    fs.writeFileSync(targetPath, file.buffer);

    return {
      filename: uniqueFilename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storageType: 'local',
    };
  }

  /**
   * URL the SERVER uses to fetch a Cloudinary asset. Authenticated assets get a signed URL;
   * legacy public assets keep their stored URL. Never send this to a client.
   */
  static getCloudinaryDeliveryUrl(file: IFileAttachment): string {
    if (file.deliveryType === 'authenticated' && file.publicCloudId) {
      return cloudinary.url(file.publicCloudId, {
        resource_type: file.mimeType === 'application/pdf' ? 'raw' : 'image',
        type: 'authenticated',
        sign_url: true,
        secure: true,
      });
    }
    if (!file.url) throw new Error('Stored file has no delivery URL');
    return file.url;
  }

  static async deleteFile(file: IFileAttachment): Promise<void> {
    try {
      if (file.storageType === 'local') {
        const filePath = this.getLocalFilePath(file.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } else if (file.publicCloudId) {
        await cloudinary.uploader.destroy(file.publicCloudId, {
          resource_type: file.mimeType === 'application/pdf' ? 'raw' : 'image',
          type: file.deliveryType === 'authenticated' ? 'authenticated' : 'upload',
          invalidate: true,
        });
      }
    } catch (e) {
      console.error('Failed to remove stored file:', e);
    }
  }

  static getLocalFilePath(filename: string): string {
    return path.join(ENV.UPLOAD_DIR, filename);
  }
}
