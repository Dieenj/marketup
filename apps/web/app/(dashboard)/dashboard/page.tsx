'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import api from '@/lib/api-client';
import { useAuthStore } from '@/hooks/use-auth';
import { statusColors } from '@/lib/order-status';


export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: shop } = useQuery({
    queryKey: ['my-shop'],
    queryFn: async () => {
      const { data } = await api.get('/shops/my-shop');
      return data;
    },
    enabled: !!user,
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', shop?.id],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/stats/${shop.id}`);
      return data;
    },
    enabled: !!shop?.id,
  });

  const statCards = [
    {
      title: "Total Revenue",
      value: `$${Number(stats?.totalRevenue || 0).toFixed(2)}`,
      description: "From delivered orders",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders ?? 0,
      description: `${stats?.pendingOrders ?? 0} pending`,
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Products",
      value: stats?.totalProducts ?? 0,
      description: "Active in your shop",
      icon: Package,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders ?? 0,
      description: "Awaiting confirmation",
      icon: Clock,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Tiêu đề đầu trang */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Welcome back, <span className="font-medium text-foreground">{user?.name}</span>. Here&apos;s how your shop is performing.
          </p>
        </div>
        <div className="text-xs text-muted-foreground bg-white border border-border/60 px-3 py-1.5 rounded-lg">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Thẻ thống kê */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.title} className="bg-white rounded-2xl border border-border/60 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{stat.title}</p>
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Biểu đồ xu hướng */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 bg-white rounded-2xl border border-border/60 p-6 hover:shadow-sm transition-shadow">
          <div className="mb-5">
            <h2 className="text-sm font-semibold">Revenue (Last 7 Days)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Daily revenue trend</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats?.revenueTrend || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111111" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#111111" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#111111"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="col-span-3 bg-white rounded-2xl border border-border/60 p-6 hover:shadow-sm transition-shadow">
          <div className="mb-5">
            <h2 className="text-sm font-semibold">Recent Orders</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Latest customer purchases</p>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : stats?.recentOrders?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No orders yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Orders will appear here</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats?.recentOrders?.map((order: { id: string; orderNumber: string; buyerName: string; totalAmount: number; status: string; createdAt: string }) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-[#fafafa] border border-border/40 hover:border-border/80 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{order.buyerName}</p>
                    <p className="text-[11px] text-muted-foreground">#{order.orderNumber}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                    <span className="text-sm font-bold">${Number(order.totalAmount).toFixed(2)}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

