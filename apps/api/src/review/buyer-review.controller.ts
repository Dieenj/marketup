import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { WriteReviewDto } from './dto/write-review.dto';
import { RateLimit } from '../common/rate-limit';
import {
  CurrentBuyer,
  OrderAccessGuard,
  type BuyerAccess,
} from '../auth/guards/buyer-access.guard';

// Đánh giá một sản phẩm trong đơn đã giao — bằng phiên người mua hoặc link của đơn
@Controller('buyer/orders/:orderNumber/items/:itemId/review')
@UseGuards(OrderAccessGuard)
export class BuyerReviewController {
  constructor(private reviewService: ReviewService) {}

  @Post()
  @RateLimit.writeReview()
  create(
    @CurrentBuyer() access: BuyerAccess,
    @Param('orderNumber') orderNumber: string,
    @Param('itemId') itemId: string,
    @Body() dto: WriteReviewDto,
  ) {
    return this.reviewService.createForBuyer(
      orderNumber.toUpperCase(),
      itemId,
      access,
      dto,
    );
  }

  @Patch()
  @RateLimit.writeReview()
  update(
    @CurrentBuyer() access: BuyerAccess,
    @Param('orderNumber') orderNumber: string,
    @Param('itemId') itemId: string,
    @Body() dto: WriteReviewDto,
  ) {
    return this.reviewService.updateForBuyer(
      orderNumber.toUpperCase(),
      itemId,
      access,
      dto,
    );
  }
}
