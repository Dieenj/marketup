import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryProvider } from './cloudinary.provider';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { imageUploadOptions } from '../common/image-upload';

@Controller('upload')
export class UploadController {
  constructor(private cloudinary: CloudinaryProvider) {}

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', imageUploadOptions()))
  async uploadImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('No image file provided');
    const url = await this.cloudinary.uploadImage(file);
    return { url };
  }
}
