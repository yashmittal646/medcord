import multer from 'multer';
import { AppError } from './appError.js';
import { ENV } from '../config/environment.js';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: ENV.MAX_FILE_SIZE_MB * 1024 * 1024, // 10MB default
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          `Invalid file type '${file.mimetype}'. Only PDF, JPEG, PNG, and WebP medical files are allowed.`,
          400
        )
      );
    }
  },
});
