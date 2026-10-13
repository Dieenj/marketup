import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';

// Thông báo cho từng ràng buộc unique (model:trường) — người dùng thấy được trên FE
const UNIQUE_MESSAGES: Record<string, string> = {
  'User:email': 'An account with this email already exists',
  'Shop:slug': 'This shop URL is already taken',
  'Shop:ownerId': 'You already own a shop',
  'Category:shopId,slug': 'A category with this name already exists',
};

// Lỗi Prisma không bắt riêng sẽ thành 500 → chuyển các lỗi do dữ liệu người dùng thành 4xx có thông báo rõ ràng.
// Lỗi khác (mất kết nối DB…) vẫn để BaseExceptionFilter trả 500 và ghi log.
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const http = this.toHttp(error);
    super.catch(http ?? error, host);
  }

  private toHttp(
    error: Prisma.PrismaClientKnownRequestError,
  ): HttpException | null {
    switch (error.code) {
      case 'P2002': {
        const model = (error.meta?.modelName as string | undefined) ?? '';
        const target = error.meta?.target;
        const fields = Array.isArray(target)
          ? target.join(',')
          : typeof target === 'string'
            ? target
            : '';
        return new ConflictException(
          UNIQUE_MESSAGES[`${model}:${fields}`] ??
            'This value is already in use',
        );
      }
      case 'P2025':
        return new NotFoundException('Not found');
      case 'P2003':
        return new BadRequestException('A related record does not exist');
      default:
        return null;
    }
  }
}
