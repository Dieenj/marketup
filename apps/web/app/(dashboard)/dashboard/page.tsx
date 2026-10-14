'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, DollarSign, Package, ShoppingBag, Clock } from 'lucide-react';
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
import { formatCurrency } from '@/lib/format';
import EmptyState from '@/components/empty-state';
import PageHeader from '@/components/dashboard/page-header';
import StatCard from '@/components/dashboard/stat-card';
import OrderStatusBadge from '@/components/order-status-badge';
import { useMyShop } from '@/hooks/use-my-shop';

interface RecentOrder {
  id: string;
  orderNumber: string;
  buyerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: shop } = useMyShop();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', shop?.id],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/stats/${shop!.id}`);
      return data;
    },
    enabled: !!shop?.id,
  });

  const pendingOrders = stats?.pendingOrders ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description={
          <>
            Welcome back, <span className="font-medium text-foreground">{user?.name}</span>.
            Here&apos;s how your shop is performing.
          </>
        }
      />

      {/* Thẻ thống kê */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={formatCurrency(stats?.totalRevenue)}
          hint="From delivered orders"
          icon={DollarSign}
          isLoading={isLoading}
        />
        <StatCard
          label="Total orders"
          value={stats?.totalOrders ?? 0}
          hint="All time"
          icon={ShoppingBag}
          isLoading={isLoading}
        />
        <StatCard
          label="Products"
          value={stats?.totalProducts ?? 0}
          hint="Active in your shop"
          icon={Package}
          isLoading={isLoading}
        />
        <StatCard
          label="Pending orders"
          value={pendingOrders}
          hint={pendingOrders > 0 ? 'Need your confirmation' : 'All caught up'}
          icon={Clock}
          tone={pendingOrders > 0 ? 'warning' : 'default'}
          isLoading={isLoading}
        />
      </div>

      {/* Biểu đồ xu hướng & đơn hàng gần đây */}
      <div className="grid gap-4 lg:grid-cols-7">
        <section className="rounded-xl border bg-card p-5 shadow-xs lg:col-span-4">
          <div className="mb-5">
            <h2 className="text-sm font-semibold">Revenue</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Last 7 days</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={stats?.revenueTrend || []}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  cursor={{ stroke: 'var(--border)' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--popover)',
                    color: 'var(--popover-foreground)',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-xs lg:col-span-3">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Recent orders</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Latest customer purchases</p>
            </div>
            <Link
              href="/orders"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !stats?.recentOrders?.length ? (
            <EmptyState
              icon={ShoppingBag}
              title="No orders yet"
              description="Share your shop link to get your first order."
              className="border-0 bg-transparent py-10"
            />
          ) : (
            <ul className="divide-y">
              {stats.recentOrders.map((order: RecentOrder) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{order.buyerName}</p>
                    <p className="text-xs text-muted-foreground font-mono">#{order.orderNumber}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCurrency(order.totalAmount)}
                    </span>
                    <OrderStatusBadge status={order.status} className="h-5 px-2 text-[11px]" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
