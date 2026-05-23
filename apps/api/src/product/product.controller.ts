import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post(':shopId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: memoryStorage(),
    }),
  )
  create(
    @GetUser('id') userId: string,
    @Param('shopId') shopId: string,
    @Body() dto: CreateProductDto,
    @Body('attributes') attributesRaw?: string,
    @Body('variants') variantsRaw?: string,
    @UploadedFiles() images?: any[],
  ) {
    return this.productService.create(
      userId,
      shopId,
      dto,
      images,
      attributesRaw,
      variantsRaw,
    );
  }

  @Get('shop/:shopId')
  findAll(@Param('shopId') shopId: string) {
    return this.productService.findAllByShop(shopId);
  }

  @Get('shop/:shopId/manage')
  @UseGuards(JwtAuthGuard)
  findAllOwner(@GetUser('id') userId: string, @Param('shopId') shopId: string) {
    return this.productService.findAllByShopOwner(userId, shopId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: memoryStorage(),
    }),
  )
  update(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Body('attributes') attributesRaw?: string,
    @Body('variants') variantsRaw?: string,
    @UploadedFiles() images?: any[],
  ) {
    return this.productService.update(
      userId,
      id,
      dto,
      images,
      attributesRaw,
      variantsRaw,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.productService.remove(userId, id);
  }
}
