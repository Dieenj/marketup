'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FilterChip } from '@/components/ui/filter-chip';
import PageHeader from '@/components/dashboard/page-header';
import StatCard, { StatCardSkeleton } from '@/components/dashboard/stat-card';
import EmptyState from '@/components/empty-state';
import { cn } from '@/lib/utils';
import { Star, MessageSquare, Reply, Filter, ShoppingBag } from 'lucide-react';
import ReviewItem from '@/components/shop/review-item';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { useMyShop } from '@/hooks/use-my-shop';

const MAX_REPLY = 1000;

// Đúng các trường GET /reviews/manage/:shopId trả về (tên người mua đã che, không có email)
interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  buyerName: string;
  editedAt?: string | null;
  sellerReply?: string | null;
  createdAt: string;
  product: { id: string; name: string; imageUrl?: string | null };
  orderItem: { variantLabel?: string | null; order: { orderNumber: string } };
}

interface SellerReviewStats {
  averageRating: number;
  count: number;
  unrepliedCount: number;
}

// Giống Shopee: đánh giá đến từ đơn đã giao và hiện ngay; người bán chỉ trả lời, không duyệt hay xoá
export default function DashboardReviewsPage() {
  const queryClient = useQueryClient();
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [unrepliedOnly, setUnrepliedOnly] = useState(false);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data: shop } = useMyShop();

  const {
    data: reviews,
    isLoading,
    isPlaceholderData,
  } = useQuery<Review[]>({
    queryKey: ['manage-reviews', shop?.id, ratingFilter, unrepliedOnly],
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (ratingFilter) params.rating = ratingFilter;
      if (unrepliedOnly) params.unreplied = 'true';
      const { data } = await api.get(`/reviews/manage/${shop!.id}`, { params });
      return data;
    },
    enabled: !!shop?.id,
    // Đổi bộ lọc: giữ danh sách cũ (làm mờ) thay vì cả trang quay về skeleton
    placeholderData: keepPreviousData,
  });

  // Số liệu do API tính trên toàn bộ đánh giá (không phụ thuộc bộ lọc đang chọn)
  const { data: stats } = useQuery<SellerReviewStats>({
    queryKey: ['manage-review-stats', shop?.id],
    queryFn: async () => (await api.get(`/reviews/manage/${shop!.id}/stats`)).data,
    enabled: !!shop?.id,
  });

  const replyMutation = useMutation({
    mutationFn: async ({ reviewId, text }: { reviewId: string; text: string }) =>
      api.patch(`/reviews/${reviewId}/reply`, { replyText: text }),
    onSuccess: () => {
      toast.success('Your response has been published!');
      setReplyingId(null);
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['manage-reviews', shop?.id] });
      queryClient.invalidateQueries({ queryKey: ['manage-review-stats', shop?.id] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to publish response.'));
    },
  });

  const header = (
    <PageHeader
      title="Customer Reviews"
      description="Reviews come from delivered orders and are published right away. Reply to thank buyers or address their feedback."
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <span className="sr-only" role="status">
          Loading reviews…
        </span>
        {header}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <Skeleton className="h-[66px] w-full rounded-xl" />
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-4 rounded-xl border bg-card p-5 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-3.5 w-48" />
                </div>
                <Skeleton className="h-7 w-12 rounded-full" />
              </div>
              <div className="space-y-2 pl-6">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const unrepliedCount = stats?.unrepliedCount ?? 0;

  return (
    <div className="space-y-6">
      {header}

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Overall Rating"
            value={stats.count > 0 ? stats.averageRating.toFixed(1) : '–'}
            hint="out of 5.0"
            icon={Star}
          />
          <StatCard
            label="Needs Reply"
            value={unrepliedCount}
            icon={Reply}
            tone={unrepliedCount > 0 ? 'warning' : 'default'}
          />
          <StatCard label="Total Reviews" value={stats.count} icon={MessageSquare} />
        </div>
      )}

      {/* Bộ lọc đánh giá */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" aria-hidden />
          <FilterChip active={!unrepliedOnly} onClick={() => setUnrepliedOnly(false)}>
            All Reviews
          </FilterChip>
          <FilterChip active={unrepliedOnly} onClick={() => setUnrepliedOnly(true)}>
            Needs reply ({unrepliedCount})
          </FilterChip>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">
            Rating:
          </span>
          {[null, 5, 4, 3, 2, 1].map((stars) => (
            <FilterChip
              key={String(stars)}
              size="sm"
              active={ratingFilter === stars}
              onClick={() => setRatingFilter(stars)}
              aria-label={stars === null ? 'All ratings' : `${stars} stars`}
            >
              {stars === null ? 'All' : `${stars} ★`}
            </FilterChip>
          ))}
        </div>
      </div>

      {!reviews || reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={
            unrepliedOnly || ratingFilter ? 'No reviews match these filters' : 'No reviews yet'
          }
          description={
            unrepliedOnly || ratingFilter
              ? 'Try adjusting your filters.'
              : 'Buyers can review their items once an order is delivered.'
          }
        />
      ) : (
        <div
          className={cn(
            'divide-y rounded-xl border bg-card px-5 transition-opacity',
            isPlaceholderData && 'opacity-60',
          )}
          aria-busy={isPlaceholderData}
        >
          {reviews.map((rev) => {
            const editing = replyingId === rev.id;
            const startReply = () => {
              setReplyingId(rev.id);
              setReplyText(rev.sellerReply || '');
            };
            return (
              <ReviewItem
                key={rev.id}
                review={{ ...rev, variantLabel: rev.orderItem.variantLabel }}
                badge={!rev.sellerReply && <Badge variant="info">Needs reply</Badge>}
                meta={<span className="font-mono"> · {rev.orderItem.order.orderNumber}</span>}
                product={
                  <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    <ShoppingBag className="size-3.5 shrink-0" aria-hidden />
                    {rev.product.name}
                  </span>
                }
                replyLabel="Your reply"
                replyAction={
                  <Button variant="ghost" size="xs" onClick={startReply}>
                    Edit
                  </Button>
                }
              >
                {editing ? (
                  <div className="space-y-2">
                    <Textarea
                      aria-label="Your reply"
                      placeholder="Thank the customer, answer their question, or explain how you'll fix the problem…"
                      className="resize-none"
                      rows={3}
                      maxLength={MAX_REPLY}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyingId(null);
                          setReplyText('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={!replyText.trim() || replyMutation.isPending}
                        onClick={() => replyMutation.mutate({ reviewId: rev.id, text: replyText })}
                      >
                        {replyMutation.isPending && <Spinner />}
                        Post reply
                      </Button>
                    </div>
                  </div>
                ) : !rev.sellerReply ? (
                  <Button variant="outline" size="sm" onClick={startReply}>
                    <Reply aria-hidden />
                    Reply
                  </Button>
                ) : undefined}
              </ReviewItem>
            );
          })}
        </div>
      )}
    </div>
  );
}
