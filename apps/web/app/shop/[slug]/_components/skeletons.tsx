import { Skeleton } from '@/components/ui/skeleton';
import type { StorefrontShop } from '@/lib/storefront-queries';
import ShopHero from '@/components/shop/shop-hero';

// Skeleton của storefront — dùng chung cho loading.tsx (server, khi chờ điều hướng)
// và nhánh đang tải ở client component, nên giữ đúng bố cục trang thật để không giật.

export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8" role="status" aria-busy="true">
      <span className="sr-only">Loading product…</span>
      <Skeleton className="mb-8 h-5 w-40" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[5fr_7fr] lg:gap-12">
        {/* Ảnh chính + thumbnail */}
        <div className="space-y-4">
          <Skeleton className="aspect-square rounded-xl" />
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
          <Skeleton className="h-14 w-full rounded-lg md:max-w-md" />
        </div>
      </div>
    </div>
  );
}

// Trang chủ shop: hero hiện thật nếu đã có thông tin shop (layout tải sẵn), chỉ phần dữ liệu còn lại là skeleton
export function StorefrontSkeleton({ shop }: { shop?: StorefrontShop }) {
  return (
    <div className="min-h-screen" aria-busy="true">
      <span className="sr-only" role="status">
        Loading shop…
      </span>
      {shop ? (
        <ShopHero shop={shop} />
      ) : (
        <section className="bg-secondary">
          <div className="container mx-auto px-4">
            <div className="flex max-w-2xl flex-col justify-center gap-4 py-12 md:min-h-96 md:py-16">
              <Skeleton className="h-10 w-3/4 bg-muted-foreground/15" />
              <Skeleton className="h-4 w-full bg-muted-foreground/10" />
              <Skeleton className="h-4 w-2/3 bg-muted-foreground/10" />
            </div>
          </div>
        </section>
      )}

      {/* Thanh tab Products / Reviews (h-12) */}
      <div className="border-b border-border">
        <div className="container mx-auto flex h-12 items-center gap-6 px-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-11 w-full max-w-md rounded-lg" />
            <Skeleton className="h-8 w-48 rounded-lg" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
                <Skeleton className="aspect-4/3 rounded-none" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
