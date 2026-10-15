import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Tiêu đề trang dùng chung cho mọi trang trong dashboard
export default function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

// Bản skeleton cùng kích thước với PageHeader (tiêu đề text-2xl + mô tả text-sm,
// mô tả xuống 2 dòng trên điện thoại)
export function PageHeaderSkeleton({ withAction = false }: { withAction?: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex h-8 items-center">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="mt-1 flex h-5 items-center">
          <Skeleton className="h-3.5 w-72 max-w-full" />
        </div>
        <div className="flex h-5 items-center sm:hidden">
          <Skeleton className="h-3.5 w-40" />
        </div>
      </div>
      {withAction && <Skeleton className="h-9 w-32" />}
    </div>
  );
}
