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
      <div className="grid gap-4 lg:grid-cols-7">
        <div className="rounded-xl border bg-card p-5 shadow-xs lg:col-span-4">
          <SectionTitleSkeleton className="mb-5" />
          <Skeleton className="h-[260px] w-full" />
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-xs lg:col-span-3">
          <SectionTitleSkeleton className="mb-4" />
          <RecentOrdersSkeleton />
        </div>
      </div>
    </div>
  );
}

// Tiêu đề card (text-sm) + dòng phụ (text-xs) của Overview
function SectionTitleSkeleton({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex h-5 items-center">
        <Skeleton className="h-3.5 w-20" />
      </div>
      <div className="mt-0.5 flex h-4 items-center">
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

// Đủ 5 hàng như API trả về; mỗi hàng cùng khung với hàng thật (tên + mã đơn | tổng tiền + badge)
export function RecentOrdersSkeleton() {
  return (
    <ul className="divide-y">
      {[0, 1, 2, 3, 4].map((i) => (
        <li
          key={i}
          className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
          <div>
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-28" />
            </div>
            <div className="flex h-4 items-center">
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-16" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}
