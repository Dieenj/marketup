import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

// Khớp với FE (banner-image-input): ảnh PNG/JPEG/WebP, tối đa 10MB.
// Ảnh giữ trong RAM trước khi đẩy lên Cloudinary → giới hạn để file lớn không làm cạn RAM của Render.
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function imageUploadOptions(maxFiles = 1): MulterOptions {
  return {
    storage: memoryStorage(),
    // Vượt fileSize → Nest trả 413 Payload Too Large
    limits: { fileSize: MAX_IMAGE_BYTES, files: maxFiles },
    fileFilter: (_req, file, callback) => {
      if (ALLOWED_IMAGE_TYPES.includes(file.mimetype))
        return callback(null, true);
      callback(
        new BadRequestException('Only PNG, JPEG or WebP images are allowed'),
        false,
      );
    },
  };
}
