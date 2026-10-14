'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import StarRating from '@/components/star-rating';
import ReviewCard from '@/components/shop/review-card';
import LoadMore from '@/components/load-more';
import { Skeleton } from '@/components/ui/skeleton';
import { getContrastColor } from '@/lib/color-utils';
import { storefrontQueries, type RatingCounts, type ShopStats } from '@/lib/storefront-queries';

const q = storefrontQueries();
const STAR_FILTERS = [5, 4, 3, 2, 1] as const;

// Tab Reviews của storefront: điểm trung bình, lọc theo số sao (kiểu Shopee), cuộn tới đâu tải tới đó
export default function ShopReviews({
  shopId,
  slug,
  stats,
  primaryColor,
}: {
  shopId: string;
  slug: string;
  stats?: ShopStats;
  primaryColor: string;
}) {
  const [rating, setRating] = useState<keyof RatingCounts | undefined>();
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(q.shopReviews(shopId, rating));
  const reviews = data?.pages.flatMap((page) => page.items) ?? [];
  const total = stats?.count ?? 0;

  const chip = (label: string, value: keyof RatingCounts | undefined, count?: number) => {
    const active = rating === value;
    return (
      <button
        key={label}
        type="button"
        aria-pressed={active}
        onClick={() => setRating(value)}
        className="rounded-xl border bg-white px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground"
        style={
          active
            ? {
                backgroundColor: primaryColor,
                color: getContrastColor(primaryColor),
                borderColor: primaryColor,
              }
            : undefined
        }
      >
        {label}
        {count !== undefined && <span className="tabular-nums opacity-75"> ({count})</span>}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-center gap-3 sm:min-w-56">
          <span className="text-5xl font-extrabold">
            {total > 0 ? (stats?.averageRating ?? 0).toFixed(1) : '–'}
          </span>
          <div>
            <StarRating value={stats?.averageRating ?? 0} starClassName="size-5" />
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              {total} {total === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </div>
        {total > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Filter reviews by rating">
            {chip('All', undefined)}
            {STAR_FILTERS.map((star) =>
              chip(`${star} ${star === 1 ? 'Star' : 'Stars'}`, star, stats?.ratingCounts?.[star]),
            )}
          </div>
        )}
      </div>

      {isPending ? (
        <div className="space-y-4" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-border/50 bg-white p-5">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Couldn&apos;t load reviews. Please try again.
        </p>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 py-12 text-center">
          <MessageSquare className="mx-auto mb-3 h-9 w-9 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-muted-foreground">
            {rating ? `No ${rating}-star reviews` : 'No reviews yet'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Reviews come from buyers once their order has been delivered.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              productHref={
                review.product ? `/shop/${slug}/products/${review.product.id}` : undefined
              }
            />
          ))}
          <LoadMore
            hasMore={!!hasNextPage}
            isLoading={isFetchingNextPage}
            onLoadMore={() => fetchNextPage()}
          />
        </div>
      )}
    </div>
  );
}
