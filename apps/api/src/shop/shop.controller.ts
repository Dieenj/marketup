import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('shops')
export class ShopController {
  constructor(private shopService: ShopService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@GetUser('id') userId: string, @Body() dto: CreateShopDto) {
    return this.shopService.create(userId, dto);
  }

  @Get('my-shop')
  @UseGuards(JwtAuthGuard)
  getMyShop(@GetUser('id') userId: string) {
    return this.shopService.findByOwner(userId);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.shopService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @GetUser('id') userId: string,
    @Param('id') shopId: string,
    @Body() dto: UpdateShopDto,
  ) {
    return this.shopService.update(userId, shopId, dto);
  }
}
