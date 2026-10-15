import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Thẻ số liệu theo kiểu "section cards" của shadcn dashboard-01
export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
  isLoading,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: 'default' | 'warning' | 'danger';
  isLoading?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 text-card-foreground shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && (
          <Icon
            className={cn(
              'size-4 text-muted-foreground',
              tone === 'warning' && 'text-amber-600 dark:text-amber-400',
              tone === 'danger' && 'text-destructive',
            )}
            aria-hidden
          />
        )}
      </div>
      {isLoading ? (
        <div className="mt-1 flex h-8 items-center">
          <Skeleton className="h-6 w-24" />
        </div>
      ) : (
        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// Skeleton cùng khung với StatCard (nhãn, giá trị, dòng gợi ý) để chiều cao khớp khi dữ liệu về
//   hint = false: thẻ không có dòng gợi ý (thấp hơn khi đứng riêng một hàng trên điện thoại)
export function StatCardSkeleton({ hint = true }: { hint?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-xs">
      {/* Mỗi hàng giữ đúng line-height của StatCard: nhãn 20px, giá trị 32px, gợi ý 16px */}
      <div className="flex h-5 items-center justify-between gap-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="size-4" />
      </div>
      <div className="mt-1 flex h-8 items-center">
        <Skeleton className="h-6 w-20" />
      </div>
      {hint && (
        <div className="mt-1 flex h-4 items-center">
          <Skeleton className="h-3 w-28" />
        </div>
      )}
    </div>
  );
}
