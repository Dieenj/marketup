import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider';
import { UploadController } from './upload.controller';

@Module({
  controllers: [UploadController],
  providers: [CloudinaryProvider],
  exports: [CloudinaryProvider],
})
export class UploadModule {}
