import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId: string, shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop || shop.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const [
      totalOrders,
      totalRevenueAgg,
      totalProducts,
      recentOrders,
      pendingOrders,
    ] = await Promise.all([
      this.prisma.order.count({ where: { shopId } }),
      this.prisma.order.aggregate({
        where: { shopId, status: 'DELIVERED' },
        _sum: { totalAmount: true },
      }),
      this.prisma.product.count({ where: { shopId } }),
      this.prisma.order.findMany({
        where: { shopId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          items: { include: { product: { select: { name: true } } } },
        },
      }),
      this.prisma.order.count({ where: { shopId, status: 'PENDING' } }),
    ]);

    // Xây dựng xu hướng doanh thu trong 7 ngày qua
    const today = new Date();
    const revenueTrend = await Promise.all(
      Array.from({ length: 7 }).map(async (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - i));
        const start = new Date(date.setHours(0, 0, 0, 0));
        const end = new Date(date.setHours(23, 59, 59, 999));
        const agg = await this.prisma.order.aggregate({
          where: {
            shopId,
            status: 'DELIVERED',
            createdAt: { gte: start, lte: end },
          },
          _sum: { totalAmount: true },
        });
        return {
          date: start.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
          revenue: Number(agg._sum.totalAmount || 0),
        };
      }),
    );

    return {
      totalOrders,
      totalRevenue: totalRevenueAgg._sum.totalAmount || 0,
      totalProducts,
      pendingOrders,
      recentOrders,
      revenueTrend,
    };
  }

  async getTopProducts(userId: string, shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop || shop.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Thống kê sơ bộ các sản phẩm bán chạy nhất theo số lượng bán ra từ các chi tiết đơn hàng (order items)
    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { shopId } },
      _sum: { quantity: true },
      orderBy: {
        _sum: { quantity: 'desc' },
      },
      take: 5,
    });

    const products = await Promise.all(
      topProducts.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });
        return {
          ...product,
          salesCount: item._sum.quantity,
        };
      }),
    );

    return products;
  }
}
