import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Số proxy đứng trước API (Render: proxy của nền tảng). Express lấy IP người dùng từ X-Forwarded-For
  // tính từ phải sang theo đúng số lớp này: thiếu → mọi người chung IP của proxy (rate limit chặn nhầm cả loạt);
  // thừa → client tự gửi X-Forwarded-For giả để lách giới hạn. Đo bằng GET /api/health/client-ip sau khi deploy.
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 0));

  // Lỗi ràng buộc dữ liệu (trùng slug/email, bản ghi không tồn tại) → 409/404/400 thay vì 500
  app.useGlobalFilters(
    new PrismaExceptionFilter(app.get(HttpAdapterHost).httpAdapter),
  );

  // Pipe kiểm thử dữ liệu toàn cục (Global validation pipe)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Cấu hình chia sẻ tài nguyên nguồn gốc chéo (CORS)
  const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Cho phép request không có origin (Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  });

  // Tiền tố đường dẫn toàn cục (Global prefix)
  app.setGlobalPrefix('api');

  // Render cấp cổng qua PORT; API_PORT cho môi trường local
  const port = process.env.PORT || process.env.API_PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api`);
}

bootstrap();
