import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

// Review hiển thị công khai: không có email người viết
const PUBLIC_REVIEW_SELECT = {
  id: true,
  rating: true,
  comment: true,
  buyerName: true,
  isVerified: true,
  sellerReply: true,
  createdAt: true,
  productId: true,
  product: { select: { id: true, name: true } },
} satisfies Prisma.ReviewSelect;

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReviewDto) {
    const { shopId, rating, comment, buyerName, buyerEmail } = dto;
    const productId = dto.productId || null;

    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop || !shop.isActive) throw new NotFoundException('Shop not found');

    // Chỉ đánh giá sản phẩm đang bán của chính shop này
    if (productId) {
      const product = await this.prisma.product.findFirst({
        where: { id: productId, shopId, isVisible: true },
        select: { id: true },
      });
      if (!product) throw new NotFoundException('Product not found');
    }

    // "Đã mua hàng": có đơn đã giao tại shop với email này (không phân biệt hoa thường),
    // và nếu đánh giá sản phẩm thì đơn phải có sản phẩm đó
    const deliveredOrder = await this.prisma.order.findFirst({
      where: {
        shopId,
        status: 'DELIVERED',
        buyerEmail: { equals: buyerEmail, mode: 'insensitive' },
        ...(productId ? { items: { some: { productId } } } : {}),
      },
      select: { id: true },
    });

    const review = await this.prisma.review.create({
      data: {
        shopId,
        productId,
        rating,
        comment,
        buyerName,
        buyerEmail,
        isVerified: !!deliveredOrder,
        status: 'PENDING', // Tất cả đánh giá đều bắt đầu với trạng thái PENDING để người bán kiểm duyệt
      },
    });
    return {
      id: review.id,
      status: review.status,
      isVerified: review.isVerified,
    };
  }

  async findByProduct(productId: string, take: number) {
    return this.prisma.review.findMany({
      where: { productId, status: 'APPROVED' },
      select: PUBLIC_REVIEW_SELECT,
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async findByShop(shopId: string, take: number) {
    return this.prisma.review.findMany({
      where: { shopId, status: 'APPROVED' },
      select: PUBLIC_REVIEW_SELECT,
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async getShopStats(shopId: string) {
    const reviews = await this.prisma.review.findMany({
      where: {
        shopId,
        status: 'APPROVED',
      },
    });

    const totalReviews = reviews.length;
    const shopOnlyReviews = reviews.filter((r) => !r.productId);
    const productReviews = reviews.filter((r) => r.productId);

    const calculateAverage = (items: typeof reviews) => {
      if (items.length === 0) return 0;
      const sum = items.reduce((acc, r) => acc + r.rating, 0);
      return Number((sum / items.length).toFixed(1));
    };

    return {
      averageShopRating: calculateAverage(shopOnlyReviews),
      shopOnlyCount: shopOnlyReviews.length,
      averageProductRating: calculateAverage(productReviews),
      productCount: productReviews.length,
      totalCount: totalReviews,
    };
  }

  async getProductRating(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: {
        productId,
        status: 'APPROVED',
      },
    });

    if (reviews.length === 0) {
      return { averageRating: 0, count: 0 };
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      averageRating: Number((sum / reviews.length).toFixed(1)),
      count: reviews.length,
    };
  }

  async findForModeration(
    userId: string,
    shopId: string,
    query: { rating?: number; status?: string },
  ) {
    // Xác thực quyền sở hữu cửa hàng
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop || shop.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const where: any = { shopId };
    if (query.rating) {
      where.rating = Number(query.rating);
    }
    if (query.status) {
      where.status = query.status;
    }

    return this.prisma.review.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async approve(userId: string, id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { shop: true },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.shop.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.review.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  async reply(userId: string, id: string, replyText: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { shop: true },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.shop.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.review.update({
      where: { id },
      data: { sellerReply: replyText },
    });
  }

  async delete(userId: string, id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { shop: true },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.shop.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.review.delete({
      where: { id },
    });
  }
}
