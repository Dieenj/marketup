'use client';

import { Eye, AlertTriangle, ShoppingBag } from 'lucide-react';

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Thẻ tổng số sản phẩm */}
      <div className="bg-white border border-border/50 rounded-2xl p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-200">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-300" />
        <div className="p-3 bg-blue-50 rounded-xl text-blue-600 relative z-10">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <div className="relative z-10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Products</p>
          <p className="text-2xl font-extrabold mt-0.5 text-foreground">{totalCount}</p>
        </div>
      </div>

      {/* Thẻ số sản phẩm đang hiển thị */}
      <div className="bg-white border border-border/50 rounded-2xl p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-200">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-300" />
        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 relative z-10">
          <div className="relative">
            <Eye className="h-6 w-6" />
            <span className="absolute top-0 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visible in Store</p>
          <p className="text-2xl font-extrabold mt-0.5 text-foreground">{visibleCount}</p>
        </div>
      </div>

      {/* Thẻ cảnh báo tồn kho */}
      <div className="bg-white border border-border/50 rounded-2xl p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-200">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-300" />
        <div className="p-3 bg-amber-50 rounded-xl text-amber-600 relative z-10">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="relative z-10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stock Alerts</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <p className="text-2xl font-extrabold text-foreground">{stockAlertsCount}</p>
            {stockAlertsCount > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                {outOfStockCount} out of stock
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
