import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { BuyerAuthService } from './buyer-auth.service';
import { RequestLoginCodeDto } from './dto/request-login-code.dto';
import { VerifyLoginCodeDto } from './dto/verify-login-code.dto';
import { RateLimit } from '../common/rate-limit';

// Người mua không có mật khẩu: nhập email → nhận mã 6 số → đăng nhập
@Controller('buyer/auth')
export class BuyerAuthController {
  constructor(private buyerAuth: BuyerAuthService) {}

  @RateLimit.requestLoginCode()
  @Post('request-code')
  @HttpCode(200)
  requestCode(@Body() dto: RequestLoginCodeDto) {
    return this.buyerAuth.requestCode(dto);
  }

  @RateLimit.verifyLoginCode()
  @Post('verify')
  @HttpCode(200)
  verify(@Body() dto: VerifyLoginCodeDto) {
    return this.buyerAuth.verifyCode(dto);
  }
}
