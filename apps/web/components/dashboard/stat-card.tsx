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
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
