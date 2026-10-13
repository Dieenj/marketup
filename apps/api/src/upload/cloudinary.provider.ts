import { v2 as cloudinary } from 'cloudinary';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryProvider {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        // Tách thư mục theo môi trường (vd. marketup-dev) để ảnh thử nghiệm không lẫn với ảnh thật
        {
          folder:
            this.configService.get<string>('CLOUDINARY_FOLDER') || 'marketup',
        },
        (error, result) => {
          if (error) return reject(new Error(error.message));
          resolve(result!.secure_url);
        },
      );
      uploadStream.end(file.buffer);
    });
  }
}
