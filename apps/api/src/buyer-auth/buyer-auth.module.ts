import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { BuyerAuthController } from './buyer-auth.controller';
import { BuyerAuthService } from './buyer-auth.service';

@Module({
  imports: [AuthModule, MailModule],
  providers: [BuyerAuthService],
  controllers: [BuyerAuthController],
})
export class BuyerAuthModule {}
