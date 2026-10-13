import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Trạng thái "chưa có dữ liệu / không có kết quả" dùng chung cho dashboard và storefront
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-4 py-20 text-center',
        className,
      )}
    >
      <div className="mb-4 rounded-xl bg-muted p-3">
        <Icon className="size-8 text-muted-foreground" aria-hidden />
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
