import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { OrderService } from './order.service';
import {
  BuyerEmail,
  BuyerSessionGuard,
  CurrentBuyer,
  OrderAccessGuard,
  type BuyerAccess,
} from '../auth/guards/buyer-access.guard';

// Phía người mua: phiên đăng nhập bằng mã email, hoặc link của một đơn (email/sau khi đặt hàng)
@Controller('buyer/orders')
export class BuyerOrderController {
  constructor(private orderService: OrderService) {}

  @Get()
  @UseGuards(BuyerSessionGuard)
  findMine(@BuyerEmail() email: string, @Query('shop') shopSlug?: string) {
    if (!shopSlug) throw new BadRequestException('shop is required');
    return this.orderService.findForBuyer(email, shopSlug);
  }

  @Get(':orderNumber')
  @UseGuards(OrderAccessGuard)
  findOne(
    @CurrentBuyer() access: BuyerAccess,
    @Param('orderNumber') orderNumber: string,
  ) {
    return this.orderService.findOneForBuyer(orderNumber.toUpperCase(), access);
  }

  @Post(':orderNumber/cancel')
  @HttpCode(200)
  @UseGuards(OrderAccessGuard)
  cancel(
    @CurrentBuyer() access: BuyerAccess,
    @Param('orderNumber') orderNumber: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orderService.cancelForBuyer(
      orderNumber.toUpperCase(),
      access,
      dto,
    );
  }
}
