import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AccessTokenService } from './access-token.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // Đã kiểm tra khi khởi động (config/env.validation.ts) — không có giá trị dự phòng
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN') || '7d',
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, AccessTokenService],
  controllers: [AuthController],
  // Guard người mua (guards/buyer-access.guard.ts) cần AccessTokenService trong module dùng nó
  exports: [AccessTokenService],
})
export class AuthModule {}
