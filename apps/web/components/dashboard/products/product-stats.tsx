'use client';

import { Eye, AlertTriangle, Package } from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';

interface ProductStatsProps {
  totalCount: number;
  visibleCount: number;
  stockAlertsCount: number;
  outOfStockCount: number;
}

export default function ProductStats({
  totalCount,
  visibleCount,
  stockAlertsCount,
  outOfStockCount,
}: ProductStatsProps) {
  return (
    <div className="grid grid-cols-1 @xl:grid-cols-3 gap-4">
      <StatCard label="Total products" value={totalCount} hint="In your inventory" icon={Package} />
      <StatCard
        label="Visible in store"
        value={visibleCount}
        hint={`${totalCount - visibleCount} hidden`}
        icon={Eye}
      />
      <StatCard
        label="Stock alerts"
        value={stockAlertsCount}
        hint={
          stockAlertsCount > 0
            ? `${outOfStockCount} out of stock · ${stockAlertsCount - outOfStockCount} low stock`
            : 'Stock levels look healthy'
        }
        icon={AlertTriangle}
        tone={outOfStockCount > 0 ? 'danger' : stockAlertsCount > 0 ? 'warning' : 'default'}
      />
    </div>
  );
}
