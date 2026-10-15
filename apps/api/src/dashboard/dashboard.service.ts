import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildRevenueTrend, vnStartOfDay } from './revenue-trend';

const TREND_DAYS = 7;

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

    const now = new Date();
    const [
      totalOrders,
      totalRevenueAgg,
      totalProducts,
      recentOrders,
      pendingOrders,
      recentDeliveries,
    ] = await Promise.all([
      this.prisma.order.count({ where: { shopId } }),
      // Doanh thu ghi nhận khi giao thành công (COD)
      this.prisma.order.aggregate({
        where: { shopId, status: 'DELIVERED' },
        _sum: { totalAmount: true },
      }),
      this.prisma.product.count({ where: { shopId, isVisible: true } }),
      this.prisma.order.findMany({
        where: { shopId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          buyerName: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.order.count({ where: { shopId, status: 'PENDING' } }),
      this.prisma.order.findMany({
        where: {
          shopId,
          status: 'DELIVERED',
          deliveredAt: { gte: vnStartOfDay(now, TREND_DAYS - 1) },
        },
        select: { deliveredAt: true, totalAmount: true },
      }),
    ]);

    // Decimal ra JSON là chuỗi → đổi sang number như revenueTrend (FE nhận number)
    return {
      totalOrders,
      totalRevenue: Number(totalRevenueAgg._sum.totalAmount ?? 0),
      totalProducts,
      pendingOrders,
      recentOrders: recentOrders.map((order) => ({
        ...order,
        totalAmount: Number(order.totalAmount),
      })),
      revenueTrend: buildRevenueTrend(recentDeliveries, now, TREND_DAYS),
    };
  }
}
