'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ORDER_TABS,
  statusLabels,
  type OrderStatusCounts,
  type OrderTab,
} from '@/lib/order-status';
import { cn } from '@/lib/utils';

// Tab trạng thái kèm số đơn (do API đếm), dùng cho danh sách đơn của người bán và người mua
export default function OrderStatusTabs({
  value,
  onChange,
  counts,
  className,
}: {
  value: OrderTab;
  onChange: (tab: OrderTab) => void;
  counts?: OrderStatusCounts;
  className?: string;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(tab) => onChange(tab as OrderTab)}
      className={cn('min-w-0', className)}
    >
      {/* Hẹp thì vuốt ngang, không hiện thanh cuộn (như thanh tab của các app mua sắm) */}
      <TabsList className="max-w-full justify-start overflow-x-auto overflow-y-hidden scrollbar-none">
        {ORDER_TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="flex-none px-2.5">
            {tab === 'ALL' ? 'All' : statusLabels[tab]}
            {counts && (
              <span className="text-xs tabular-nums text-muted-foreground">{counts[tab]}</span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
