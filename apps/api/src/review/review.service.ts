import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async create(dto: {
    shopId: string;
    productId?: string;
    rating: number;
    comment?: string;
    buyerName: string;
    buyerEmail: string;
  }) {
    const { shopId, productId, rating, comment, buyerName, buyerEmail } = dto;

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Xác thực lượt mua hàng
    let isVerified = false;
    
    // Tìm kiếm các đơn hàng đã hoàn thành khớp với email này
    const orders = await this.prisma.order.findMany({
      where: {
        buyerEmail: buyerEmail,
        shopId: shopId,
        status: 'DELIVERED', // Phải ở trạng thái đã giao hàng thành công
      },
      include: {
        items: true,
      },
    });

    if (orders.length > 0) {
      if (productId) {
        // Phải chứa một chi tiết đơn hàng (OrderItem) khớp với productId này
        isVerified = orders.some((order) =>
          order.items.some((item) => item.productId === productId),
        );
      } else {
        // Đối với đánh giá chung của cửa hàng, chỉ cần có bất kỳ đơn hàng nào đã giao tại cửa hàng này
        isVerified = true;
      }
    }

    return this.prisma.review.create({
      data: {
        shopId,
        productId: productId || null,
        rating,
        comment,
        buyerName,
        buyerEmail,
        isVerified,
        status: 'PENDING', // Tất cả đánh giá đều bắt đầu với trạng thái PENDING để người bán kiểm duyệt
      },
    });
  }

  async findByProduct(productId: string) {
    return this.prisma.review.findMany({
      where: {
        productId,
        status: 'APPROVED',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByShop(shopId: string) {
    return this.prisma.review.findMany({
      where: {
        shopId,
        status: 'APPROVED',
      },
      orderBy: {
        createdAt: 'desc',
      },
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

  async findForModeration(userId: string, shopId: string, query: { rating?: number; status?: string }) {
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
