import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Chẩn đoán cấu hình TRUST_PROXY_HOPS: mở từ trình duyệt rồi so `ip` với IP thật (https://api.ipify.org).
  // Chỉ trả về thông tin của chính người gọi.
  @Get('health/client-ip')
  clientIp(@Req() req: Request) {
    return {
      ip: req.ip,
      forwardedFor: req.headers['x-forwarded-for'] ?? null,
      trustProxyHops: Number(process.env.TRUST_PROXY_HOPS ?? 0),
    };
  }
}
