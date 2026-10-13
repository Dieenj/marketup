import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RateLimit } from '../common/rate-limit';

@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post()
  @RateLimit.placeOrder()
  create(@Body() dto: CreateOrderDto) {
    return this.orderService.create(dto);
  }

  @Get('shop/:shopId')
  @UseGuards(JwtAuthGuard)
  findAll(@GetUser('id') userId: string, @Param('shopId') shopId: string) {
    return this.orderService.findAllByShop(userId, shopId);
  }

  // Chi tiết đầy đủ (có thông tin liên hệ người mua) → chỉ chủ shop
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.orderService.findOne(userId, id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(userId, id, dto);
  }
}
