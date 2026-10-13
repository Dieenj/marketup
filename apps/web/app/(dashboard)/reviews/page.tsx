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
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Star, MessageSquare, Reply, Filter, Calendar, User, ShoppingBag } from 'lucide-react';
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
                <Skeleton className="h-7 w-12 rounded-xl" />
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
          className={cn('space-y-4 transition-opacity', isPlaceholderData && 'opacity-60')}
          aria-busy={isPlaceholderData}
        >
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="space-y-4 rounded-xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-base text-foreground flex items-center gap-1.5">
                      <User className="h-4 w-4 text-muted-foreground/60" aria-hidden />
                      {rev.buyerName}
                    </span>
                    {!rev.sellerReply && <Badge variant="info">Needs reply</Badge>}
                    {rev.editedAt && <Badge variant="outline">Edited</Badge>}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" aria-hidden />
                      {formatDate(rev.createdAt)}
                    </span>
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
                      {rev.product.name}
                      {rev.orderItem.variantLabel && ` · ${rev.orderItem.variantLabel}`}
                    </span>
                    <span className="font-mono">{rev.orderItem.order.orderNumber}</span>
                  </div>
                </div>

                <div
                  className="flex items-center bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-xl gap-1"
                  aria-label={`${rev.rating} out of 5 stars`}
                >
                  <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                  <span className="text-xs font-bold">{rev.rating}</span>
                </div>
              </div>

              {rev.comment && (
                <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap pl-6 border-l-2 border-muted">
                  {rev.comment}
                </p>
              )}

              {/* Khu vực nhập câu trả lời của người bán */}
              {replyingId === rev.id ? (
                <div className="bg-muted/50 border rounded-xl p-4 space-y-3 ml-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Write response
                    </span>
                    <button
                      onClick={() => {
                        setReplyingId(null);
                        setReplyText('');
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  <Textarea
                    aria-label="Your response"
                    placeholder="Thank the customer for their review, answer questions, or address complaints..."
                    className="resize-none rounded-xl"
                    rows={3}
                    maxLength={MAX_REPLY}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      disabled={!replyText.trim() || replyMutation.isPending}
                      onClick={() => replyMutation.mutate({ reviewId: rev.id, text: replyText })}
                      className="rounded-xl h-8 font-bold gap-1.5 px-4"
                    >
                      <Reply className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Publish Response
                    </Button>
                  </div>
                </div>
              ) : rev.sellerReply ? (
                <div className="ml-6 bg-primary/5 border-l-2 border-primary rounded-r-xl p-4 mt-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-primary">Your Response</p>
                    <button
                      onClick={() => {
                        setReplyingId(rev.id);
                        setReplyText(rev.sellerReply || '');
                      }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Reply className="h-3 w-3" aria-hidden /> Edit
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {rev.sellerReply}
                  </p>
                </div>
              ) : (
                <div className="pl-6">
                  <button
                    onClick={() => {
                      setReplyingId(rev.id);
                      setReplyText('');
                    }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 font-bold"
                  >
                    <Reply className="h-3.5 w-3.5" aria-hidden />
                    Respond to this review
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
