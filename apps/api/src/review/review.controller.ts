import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards, Query } from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('reviews')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @Post()
  create(
    @Body() dto: {
      shopId: string;
      productId?: string;
      rating: number;
      comment?: string;
      buyerName: string;
      buyerEmail: string;
    },
  ) {
    return this.reviewService.create(dto);
  }

  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.reviewService.findByProduct(productId);
  }

  @Get('product/:productId/rating')
  getProductRating(@Param('productId') productId: string) {
    return this.reviewService.getProductRating(productId);
  }

  @Get('shop/:shopId')
  findByShop(@Param('shopId') shopId: string) {
    return this.reviewService.findByShop(shopId);
  }

  @Get('shop/:shopId/stats')
  getShopStats(@Param('shopId') shopId: string) {
    return this.reviewService.getShopStats(shopId);
  }

  @Get('manage/:shopId')
  @UseGuards(JwtAuthGuard)
  findForModeration(
    @GetUser('id') userId: string,
    @Param('shopId') shopId: string,
    @Query('rating') rating?: number,
    @Query('status') status?: string,
  ) {
    return this.reviewService.findForModeration(userId, shopId, { rating, status });
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  approve(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.reviewService.approve(userId, id);
  }

  @Patch(':id/reply')
  @UseGuards(JwtAuthGuard)
  reply(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body('replyText') replyText: string,
  ) {
    return this.reviewService.reply(userId, id, replyText);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.reviewService.delete(userId, id);
  }
}
