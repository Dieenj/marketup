import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Logger, Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ShopModule } from './shop/shop.module';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { OrderModule } from './order/order.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadModule } from './upload/upload.module';
import { ReviewModule } from './review/review.module';
import { MailModule } from './mail/mail.module';
import { validateEnv } from './config/env.validation';
import { DEFAULT_RATE_LIMIT } from './common/rate-limit';
import type { Request } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env.local', '../../.env', '.env.local', '.env'],
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Chỉ để chạy bộ test tự động ở local (bắn hàng trăm request/phút); không bao giờ bật trên server
        const disabled = config.get('RATE_LIMIT_DISABLED') === 'true';
        if (disabled)
          new Logger('RateLimit').warn(
            'RATE_LIMIT_DISABLED=true — rate limiting is OFF',
          );
        return {
          throttlers: [DEFAULT_RATE_LIMIT],
          // Không giới hạn request đọc: storefront SSR gọi API từ vài IP máy chủ Vercel dùng chung cho mọi khách,
          // giới hạn theo IP sẽ chặn cả trang. Request ghi và endpoint nhạy cảm (đăng nhập, đặt đơn…) vẫn bị giới hạn.
          skipIf: (context) =>
            disabled ||
            SAFE_METHODS.has(
              context.switchToHttp().getRequest<Request>().method,
            ),
          // FE hiển thị nguyên văn thông báo này (getErrorMessage)
          errorMessage:
            'Too many requests. Please wait a minute and try again.',
        };
      },
    }),
    PrismaModule,
    AuthModule,
    ShopModule,
    ProductModule,
    CategoryModule,
    OrderModule,
    DashboardModule,
    UploadModule,
    ReviewModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
