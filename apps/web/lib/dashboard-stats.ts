import { queryOptions } from '@tanstack/react-query';
import api from '@/lib/api-client';

interface RecentOrder {
  id: string;
  orderNumber: string;
  buyerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  revenueTrend: { date: string; revenue: number }[];
  recentOrders: RecentOrder[];
}

// Số liệu trang Overview — dùng ở trang Overview và trang đăng nhập (tải sẵn ngay khi đăng nhập xong)
export function dashboardStatsQuery(shopId: string | undefined) {
  return queryOptions({
    queryKey: ['dashboard-stats', shopId],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>(`/dashboard/stats/${shopId}`);
      return data;
    },
    enabled: !!shopId,
  });
}
