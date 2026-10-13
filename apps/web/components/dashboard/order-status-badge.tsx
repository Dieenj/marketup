import { cn } from '@/lib/utils';
import { statusColors, statusDotColors, statusLabels } from '@/lib/order-status';

export default function OrderStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap',
        statusColors[status] ?? 'bg-muted text-muted-foreground',
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', statusDotColors[status] ?? 'bg-muted-foreground')} />
      {statusLabels[status] ?? status}
    </span>
  );
}
