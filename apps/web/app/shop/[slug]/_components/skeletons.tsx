import { Skeleton } from '@/components/ui/skeleton';
import type { StorefrontShop } from '@/lib/storefront-queries';
import ShopHero from './shop-hero';

// Skeleton của storefront — dùng chung cho loading.tsx (server, khi chờ điều hướng)
// và nhánh đang tải ở client component, nên giữ đúng bố cục trang thật để không giật.

export function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8" role="status" aria-busy="true">
      <span className="sr-only">Loading product…</span>
      <Skeleton className="mb-8 h-5 w-40" />
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {/* Ảnh chính + thumbnail */}
        <div className="space-y-4">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="flex gap-2 pb-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="size-20 shrink-0 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Thông tin, tuỳ chọn, nút mua */}
        <div className="flex flex-col space-y-6">
          <div>
            <Skeleton className="mb-3 h-6 w-24 rounded-full" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="mt-2 h-5 w-44" />
            <Skeleton className="mt-3 h-9 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          {[0, 1].map((group) => (
            <div key={group} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-16 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Trang chủ shop: hero hiện thật nếu đã có thông tin shop (layout tải sẵn), chỉ phần dữ liệu còn lại là skeleton
export function StorefrontSkeleton({ shop }: { shop?: StorefrontShop }) {
  return (
    <div className="min-h-screen" aria-busy="true">
      <span className="sr-only" role="status">Loading shop…</span>
      {shop ? (
        <ShopHero shop={shop} />
      ) : (
        <section className="bg-secondary">
          <div className="container mx-auto px-4 py-20 sm:py-28">
            <div className="max-w-2xl space-y-4">
              <Skeleton className="h-10 w-3/4 bg-muted-foreground/15" />
              <Skeleton className="h-4 w-full bg-muted-foreground/10" />
              <Skeleton className="h-4 w-2/3 bg-muted-foreground/10" />
            </div>
          </div>
        </section>
      )}

      {/* Thanh thống kê: 4 ô (giá trị text-lg 28px + nhãn text-xs 16px) */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="flex h-7 items-center">
                <Skeleton className="h-5 w-12" />
              </div>
              <div className="flex h-4 items-center">
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        <section className="space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-11 max-w-md rounded-xl" />
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                <Skeleton className="aspect-4/3 rounded-none" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-9 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
