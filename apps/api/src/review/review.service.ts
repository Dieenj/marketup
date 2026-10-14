import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { BuyerAccess } from '../auth/guards/buyer-access.guard';
import { buyerOrderWhere } from '../order/buyer-order-access';
import { WriteReviewDto } from './dto/write-review.dto';
import {
  isWithinReviewWindow,
  maskBuyerName,
  REVIEW_WINDOW_DAYS,
} from './review-rules';
import { BUYER_REVIEW_SELECT, PUBLIC_REVIEW_SELECT } from './review-select';
import { reviewPageArgs, toRatingCounts, toReviewPage } from './review-list';
import { ShopReviewsQueryDto } from './dto/shop-reviews-query.dto';

// Sản phẩm bị ẩn → đánh giá của nó cũng không hiện công khai
const VISIBLE_PRODUCT: Prisma.ReviewWhereInput = {
  product: { isVisible: true },
};

// Trang quản lý chưa phân trang
const MAX_SELLER_REVIEWS = 200;

type RatingAggregate = {
  _avg: { rating: number | null };
  _count: number;
};

const toRating = ({ _avg, _count }: RatingAggregate) => ({
  averageRating: Number((_avg.rating ?? 0).toFixed(1)),
  count: _count,
});

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  // ─── Người mua (trang đơn hàng) ───

  async createForBuyer(
    orderNumber: string,
    itemId: string,
    access: BuyerAccess,
    { rating, comment }: WriteReviewDto,
  ) {
    const item = await this.findReviewableItem(orderNumber, itemId, access);
    if (item.review) {
      throw new ConflictException('You have already reviewed this item');
    }
    // Hai request cùng lúc → ràng buộc unique orderItemId chặn bản thứ hai (409)
    return this.prisma.review.create({
      data: {
        rating,
        comment: comment || null,
        buyerName: maskBuyerName(item.order.buyerName),
        shopId: item.order.shopId,
        productId: item.productId,
        orderItemId: item.id,
      },
      select: BUYER_REVIEW_SELECT,
    });
  }

  async updateForBuyer(
    orderNumber: string,
    itemId: string,
    access: BuyerAccess,
    { rating, comment }: WriteReviewDto,
  ) {
    const item = await this.findReviewableItem(orderNumber, itemId, access);
    if (!item.review) throw new NotFoundException('Review not found');

    // Chỉ sửa một lần — điều kiện editedAt = null nằm trong câu update nên hai lần sửa song song không cùng lọt
    const { count } = await this.prisma.review.updateMany({
      where: { id: item.review.id, editedAt: null },
      data: { rating, comment: comment || null, editedAt: new Date() },
    });
    if (count === 0) {
      throw new BadRequestException('You can only edit a review once');
    }
    return this.prisma.review.findUniqueOrThrow({
      where: { id: item.review.id },
      select: BUYER_REVIEW_SELECT,
    });
  }

  private async findReviewableItem(
    orderNumber: string,
    itemId: string,
    access: BuyerAccess,
  ) {
    const item = await this.prisma.orderItem.findFirst({
      where: { id: itemId, order: buyerOrderWhere(orderNumber, access) },
      select: {
        id: true,
        productId: true,
        review: { select: { id: true } },
        order: {
          select: {
            status: true,
            deliveredAt: true,
            buyerName: true,
            shopId: true,
          },
        },
      },
    });
    if (!item) throw new NotFoundException('Order item not found');
    if (item.order.status !== 'DELIVERED') {
      throw new BadRequestException(
        'You can review items once your order has been delivered',
      );
    }
    if (!isWithinReviewWindow(item.order.deliveredAt)) {
      throw new BadRequestException(
        `Reviews are open for ${REVIEW_WINDOW_DAYS} days after delivery`,
      );
    }
    return item;
  }

  // ─── Công khai (storefront) ───

  findByProduct(productId: string, take: number) {
    return this.prisma.review.findMany({
      where: { productId, ...VISIBLE_PRODUCT },
      select: PUBLIC_REVIEW_SELECT,
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async findByShop(shopId: string, { rating, cursor }: ShopReviewsQueryDto) {
    const rows = await this.prisma.review.findMany({
      where: { shopId, ...VISIBLE_PRODUCT, ...(rating && { rating }) },
      select: PUBLIC_REVIEW_SELECT,
      ...reviewPageArgs(cursor),
    });
    return toReviewPage(rows);
  }

  // Điểm shop = trung bình mọi đánh giá sản phẩm của shop (giống Shopee), kèm số đánh giá mỗi mức sao
  async getShopStats(shopId: string) {
    const where = { shopId, ...VISIBLE_PRODUCT };
    const [all, groups] = await Promise.all([
      this.prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: true,
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where,
        _count: { _all: true },
      }),
    ]);
    return { ...toRating(all), ratingCounts: toRatingCounts(groups) };
  }

  async getProductRating(productId: string) {
    return toRating(
      await this.prisma.review.aggregate({
        where: { productId, ...VISIBLE_PRODUCT },
        _avg: { rating: true },
        _count: true,
      }),
    );
  }

  // ─── Người bán (dashboard): chỉ xem và trả lời, không ẩn/xoá ───

  async findForSeller(
    userId: string,
    shopId: string,
    filter: { rating?: number; unreplied?: boolean },
  ) {
    await this.assertShopOwner(userId, shopId);
    return this.prisma.review.findMany({
      where: {
        shopId,
        ...(filter.rating && { rating: filter.rating }),
        ...(filter.unreplied && { sellerReply: null }),
      },
      select: {
        ...PUBLIC_REVIEW_SELECT,
        product: { select: { id: true, name: true, imageUrl: true } },
        orderItem: {
          select: {
            variantLabel: true,
            order: { select: { orderNumber: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_SELLER_REVIEWS,
    });
  }

  async getSellerStats(userId: string, shopId: string) {
    await this.assertShopOwner(userId, shopId);
    const [all, unrepliedCount] = await Promise.all([
      this.prisma.review.aggregate({
        where: { shopId },
        _avg: { rating: true },
        _count: true,
      }),
      this.prisma.review.count({ where: { shopId, sellerReply: null } }),
    ]);
    return { ...toRating(all), unrepliedCount };
  }

  async reply(userId: string, id: string, replyText: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      select: { shop: { select: { ownerId: true } } },
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.shop.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return this.prisma.review.update({
      where: { id },
      data: { sellerReply: replyText, sellerRepliedAt: new Date() },
      select: PUBLIC_REVIEW_SELECT,
    });
  }

  private async assertShopOwner(userId: string, shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { ownerId: true },
    });
    if (!shop || shop.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }
}
