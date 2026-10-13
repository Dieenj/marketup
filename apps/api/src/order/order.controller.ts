import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { LookupOrderDto } from './dto/lookup-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orderService.create(dto);
  }

  @Get('shop/:shopId')
  @UseGuards(JwtAuthGuard)
  findAll(@GetUser('id') userId: string, @Param('shopId') shopId: string) {
    return this.orderService.findAllByShop(userId, shopId);
  }

  // Người mua tra cứu đơn (không cần đăng nhập). POST để email không nằm trên URL/log
  @Post('lookup')
  @HttpCode(200)
  lookup(@Body() dto: LookupOrderDto) {
    return this.orderService.lookup(dto);
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
    return this.orderService.updateStatus(userId, id, dto.status);
  }
}
