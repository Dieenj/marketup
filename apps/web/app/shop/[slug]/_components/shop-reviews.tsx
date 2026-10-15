'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { MessageSquare, ShoppingBag } from 'lucide-react';
import ReviewItem, { ReviewItemSkeleton, ReviewSummary } from '@/components/shop/review-item';
import EmptyState from '@/components/empty-state';
import LoadMore from '@/components/load-more';
import { FilterChip } from '@/components/ui/filter-chip';
import { storefrontQueries, type RatingCounts, type ShopStats } from '@/lib/storefront-queries';

const q = storefrontQueries();
const STAR_FILTERS = [5, 4, 3, 2, 1] as const;

// Tab Reviews của storefront: điểm trung bình, lọc theo số sao (kiểu Shopee), cuộn tới đâu tải tới đó
export default function ShopReviews({
  shopId,
  slug,
  shopName,
  stats,
}: {
  shopId: string;
  slug: string;
  shopName: string;
  stats?: ShopStats;
}) {
  const [rating, setRating] = useState<keyof RatingCounts | undefined>();
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(q.shopReviews(shopId, rating));
  const reviews = data?.pages.flatMap((page) => page.items) ?? [];
  const total = stats?.count ?? 0;

  const chip = (label: string, value: keyof RatingCounts | undefined, count?: number) => (
    <FilterChip key={label} active={rating === value} onClick={() => setRating(value)}>
      {label}
      {count !== undefined && <span className="tabular-nums opacity-75">({count})</span>}
    </FilterChip>
  );

  return (
    <div className="space-y-6">
      <ReviewSummary average={stats?.averageRating ?? 0} count={total}>
        {total > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Filter reviews by rating">
            {chip('All', undefined)}
            {STAR_FILTERS.map((star) =>
              chip(`${star} ${star === 1 ? 'Star' : 'Stars'}`, star, stats?.ratingCounts?.[star]),
            )}
          </div>
        )}
      </ReviewSummary>

      {isPending ? (
        <div className="divide-y" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <ReviewItemSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Couldn&apos;t load reviews. Please try again.
        </p>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={rating ? `No ${rating}-star reviews` : 'No reviews yet'}
          description="Reviews come from buyers once their order has been delivered."
          className="py-12"
        />
      ) : (
        <div className="divide-y">
          {reviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={{ ...review, variantLabel: review.orderItem?.variantLabel }}
              replyLabel={`Response from ${shopName}`}
              product={
                review.product && (
                  <Link
                    href={`/shop/${slug}/products/${review.product.id}`}
                    prefetch={false}
                    className="inline-flex max-w-full items-center gap-1.5 truncate rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ShoppingBag className="size-3.5 shrink-0" aria-hidden />
                    {review.product.name}
                  </Link>
                )
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
