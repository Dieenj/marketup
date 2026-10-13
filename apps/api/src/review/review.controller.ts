import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ReplyReviewDto } from './dto/reply-review.dto';

const MAX_PUBLIC_REVIEWS = 50;

function parseLimit(raw?: string) {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0
    ? Math.min(n, MAX_PUBLIC_REVIEWS)
    : MAX_PUBLIC_REVIEWS;
}

// Người mua viết đánh giá từ trang đơn hàng: xem BuyerReviewController
@Controller('reviews')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @Get('product/:productId')
  findByProduct(
    @Param('productId') productId: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewService.findByProduct(productId, parseLimit(limit));
  }

  @Get('product/:productId/rating')
  getProductRating(@Param('productId') productId: string) {
    return this.reviewService.getProductRating(productId);
  }

  @Get('shop/:shopId')
  findByShop(@Param('shopId') shopId: string, @Query('limit') limit?: string) {
    return this.reviewService.findByShop(shopId, parseLimit(limit));
  }

  @Get('shop/:shopId/stats')
  getShopStats(@Param('shopId') shopId: string) {
    return this.reviewService.getShopStats(shopId);
  }

  @Get('manage/:shopId')
  @UseGuards(JwtAuthGuard)
  findForSeller(
    @GetUser('id') userId: string,
    @Param('shopId') shopId: string,
    @Query('rating') rating?: string,
    @Query('unreplied') unreplied?: string,
  ) {
    const ratingNumber = rating ? Number(rating) : undefined;
    if (
      ratingNumber !== undefined &&
      !(
        Number.isInteger(ratingNumber) &&
        ratingNumber >= 1 &&
        ratingNumber <= 5
      )
    ) {
      throw new BadRequestException('rating must be an integer from 1 to 5');
    }
    return this.reviewService.findForSeller(userId, shopId, {
      rating: ratingNumber,
      unreplied: unreplied === 'true',
    });
  }

  @Get('manage/:shopId/stats')
  @UseGuards(JwtAuthGuard)
  getSellerStats(
    @GetUser('id') userId: string,
    @Param('shopId') shopId: string,
  ) {
    return this.reviewService.getSellerStats(userId, shopId);
  }

  @Patch(':id/reply')
  @UseGuards(JwtAuthGuard)
  reply(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ReplyReviewDto,
  ) {
    return this.reviewService.reply(userId, id, dto.replyText);
  }
}
