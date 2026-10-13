import {
  BadRequestException,
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { RateLimit } from '../common/rate-limit';

const MAX_PUBLIC_REVIEWS = 50;

function parseLimit(raw?: string) {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0
    ? Math.min(n, MAX_PUBLIC_REVIEWS)
    : MAX_PUBLIC_REVIEWS;
}

@Controller('reviews')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @Post()
  @RateLimit.writeReview()
  create(@Body() dto: CreateReviewDto) {
    return this.reviewService.create(dto);
  }

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

  // `limit` đọc riêng (không dùng DTO) vì FE còn gửi kèm `status` — whitelist sẽ chặn tham số lạ
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
  findForModeration(
    @GetUser('id') userId: string,
    @Param('shopId') shopId: string,
    @Query('rating') rating?: string,
    @Query('status') status?: string,
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
    if (status && !['PENDING', 'APPROVED'].includes(status)) {
      throw new BadRequestException('status must be PENDING or APPROVED');
    }
    return this.reviewService.findForModeration(userId, shopId, {
      rating: ratingNumber,
      status,
    });
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
