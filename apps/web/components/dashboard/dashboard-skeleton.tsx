import { Skeleton } from '@/components/ui/skeleton';
import { PageHeaderSkeleton } from '@/components/dashboard/page-header';
import { StatCardSkeleton } from '@/components/dashboard/stat-card';

// Vùng nội dung khi đang xác thực / tải shop (sidebar và header thật đã hiện sẵn).
// Lúc này chưa biết trang nào sẽ hiện nên tiêu đề cũng là skeleton; bố cục theo trang Overview.
export default function DashboardContentSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-busy="true">
      <span className="sr-only">Loading your shop…</span>
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="h-[320px] rounded-xl" />
    </div>
  );
}
