import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ReviewItemSkeleton, ReviewSummarySkeleton } from '@/components/shop/review-item';
import type { StorefrontShop } from '@/lib/storefront-queries';
import ShopHero from '@/components/shop/shop-hero';

// Skeleton của storefront — dùng chung cho loading.tsx (server, khi chờ điều hướng)
// và nhánh đang tải ở client component, nên giữ đúng bố cục trang thật để không giật.

// Mỗi hàng cao đúng bằng line-height chữ thật; không vẽ hàng ảnh nhỏ (chỉ có khi sản phẩm nhiều ảnh)
export function ProductDetailSkeleton() {
  const textLine = (width: string, className = '') => (
    <div className={cn('flex h-[1lh] items-center', className)}>
      <Skeleton className={cn('h-4', width)} />
    </div>
  );
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8" role="status" aria-busy="true">
      <span className="sr-only">Loading product…</span>
      <Skeleton className="mb-8 h-5 w-28" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[5fr_7fr] lg:gap-12">
        {/* Bọc trong div như ảnh thật: ô vuông nằm trực tiếp trong grid sẽ bị kéo cao theo cột phải → rộng ra */}
        <div>
          <Skeleton className="aspect-square rounded-xl" />
        </div>

        {/* Thông tin, tuỳ chọn, nút mua */}
        <div className="flex flex-col space-y-6">
          <div>
            <Skeleton className="mb-3 h-5 w-24 rounded-full" />
            <div className="flex h-9 items-center sm:h-10">
              <Skeleton className="h-7 w-3/4 sm:h-8" />
            </div>
            <div className="mt-2 flex h-[18px] items-center">
              <Skeleton className="h-3.5 w-36" />
            </div>
            <div className="mt-3 flex h-9 items-center">
              <Skeleton className="h-7 w-28" />
            </div>
          </div>
          <div>
            <div className="mb-2 flex h-5 items-center">
              <Skeleton className="h-3.5 w-24" />
            </div>
            <div className="text-base leading-relaxed">
              {textLine('w-full')}
              {textLine('w-2/3')}
              {textLine('w-1/2', 'md:hidden')}
            </div>
          </div>
          {[0, 1].map((group) => (
            <div key={group} className="space-y-2">
              <div className="flex h-5 items-center">
                <Skeleton className="h-3.5 w-14" />
              </div>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-12 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
          <div className="flex h-5 items-center">
            <Skeleton className="h-3.5 w-40" />
          </div>
          {/* Điện thoại: nút thêm vào giỏ nằm ở thanh dính đáy */}
          <div className="flex flex-col gap-3 md:max-w-md">
            <Skeleton className="hidden h-14 rounded-lg md:block" />
            <Skeleton className="h-12 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="mt-16 space-y-6 border-t pt-12">
        <div className="flex h-8 items-center">
          <Skeleton className="h-6 w-48" />
        </div>
        <ReviewSummarySkeleton />
        <div className="divide-y">
          <ReviewItemSkeleton product={false} />
        </div>
      </div>

      <div className="sticky bottom-0 z-40 -mx-4 mt-8 flex items-center gap-3 border-t bg-background/95 px-4 py-3 md:hidden">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-12 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

// Trang chủ shop: hero hiện thật nếu đã có thông tin shop (layout tải sẵn), chỉ phần dữ liệu còn lại là skeleton.
// rating: điểm trung bình nếu đã có; chưa có thì hero giữ chỗ cho hàng điểm để không bị đẩy xuống khi dữ liệu về
export function StorefrontSkeleton({
  shop,
  rating,
}: {
  shop?: StorefrontShop;
  rating?: number;
}) {
  return (
    <div className="min-h-screen" aria-busy="true">
      <span className="sr-only" role="status">
        Loading shop…
      </span>
      {shop ? (
        <ShopHero shop={shop} rating={rating ?? 'loading'} />
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
            <Skeleton className="h-11 w-full max-w-md rounded-lg border" />
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
                {/* Tên (điện thoại thường 2 dòng), giá, nút — mỗi hàng cao bằng line-height chữ thật */}
                <div className="flex flex-col gap-3 p-4">
                  <div className="text-sm leading-snug">
                    <div className="flex h-[1lh] items-center">
                      <Skeleton className="h-3.5 w-4/5" />
                    </div>
                    <div className="flex h-[1lh] items-center sm:hidden">
                      <Skeleton className="h-3.5 w-1/2" />
                    </div>
                  </div>
                  <div className="flex h-6 items-center">
                    <Skeleton className="h-4 w-16" />
                  </div>
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
