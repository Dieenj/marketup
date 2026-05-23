import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Post(':shopId')
  @UseGuards(JwtAuthGuard)
  create(
    @GetUser('id') userId: string,
    @Param('shopId') shopId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoryService.create(userId, shopId, dto);
  }

  @Get('shop/:shopId')
  findAll(@Param('shopId') shopId: string) {
    return this.categoryService.findAllByShop(shopId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.categoryService.remove(userId, id);
  }
}
