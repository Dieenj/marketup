import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { MailModule } from '../mail/mail.module';
import { AuthModule } from '../auth/auth.module';
import { BuyerOrderController } from './buyer-order.controller';

@Module({
  imports: [MailModule, AuthModule],
  providers: [OrderService],
  controllers: [OrderController, BuyerOrderController],
  exports: [OrderService],
})
export class OrderModule {}
