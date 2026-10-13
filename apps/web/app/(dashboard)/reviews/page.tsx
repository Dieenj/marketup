'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
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
import {
  Star,
  CheckCircle2,
  Trash2,
  MessageSquare,
  Reply,
  Filter,
  Calendar,
  User,
  ShoppingBag,
  Award,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMyShop } from '@/hooks/use-my-shop';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  buyerName: string;
  buyerEmail: string;
  isVerified: boolean;
  status: string;
  sellerReply?: string;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
}

export default function DashboardReviewsPage() {
  const queryClient = useQueryClient();
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // 1. Lấy thông tin cửa hàng của người bán
  const { data: shop } = useMyShop();

  // 2. Lấy danh sách đánh giá để kiểm duyệt
  const { data: reviews, isLoading, isPlaceholderData } = useQuery<Review[]>({
    queryKey: ['manage-reviews', shop?.id, ratingFilter, statusFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (ratingFilter) params.rating = ratingFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get(`/reviews/manage/${shop!.id}`, { params });
      return data;
    },
    enabled: !!shop?.id,
    // Đổi bộ lọc: giữ danh sách cũ (làm mờ) thay vì cả trang quay về skeleton
    placeholderData: keepPreviousData,
  });

  // 3. Lấy thông số điểm đánh giá chung của cửa hàng
  const { data: stats } = useQuery({
    queryKey: ['shop-stats', shop?.id],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/shop/${shop!.id}/stats`);
      return data;
    },
    enabled: !!shop?.id,
  });

  // 4. Các mutation để cập nhật dữ liệu (duyệt/trả lời/xóa)
  const approveMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      return api.patch(`/reviews/${reviewId}/approve`);
    },
    onSuccess: () => {
      toast.success('Review approved successfully and is now live!');
      queryClient.invalidateQueries({ queryKey: ['manage-reviews', shop?.id] });
      queryClient.invalidateQueries({ queryKey: ['shop-stats', shop?.id] });
    },
    onError: () => {
      toast.error('Failed to approve review.');
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ reviewId, text }: { reviewId: string; text: string }) => {
      return api.patch(`/reviews/${reviewId}/reply`, { replyText: text });
    },
    onSuccess: () => {
      toast.success('Your response has been published!');
      setReplyingId(null);
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['manage-reviews', shop?.id] });
    },
    onError: () => {
      toast.error('Failed to publish response.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      return api.delete(`/reviews/${reviewId}`);
    },
    onSuccess: () => {
      toast.success('Review deleted.');
      queryClient.invalidateQueries({ queryKey: ['manage-reviews', shop?.id] });
      queryClient.invalidateQueries({ queryKey: ['shop-stats', shop?.id] });
    },
    onError: () => {
      toast.error('Failed to delete review.');
    },
  });

  const header = (
    <PageHeader
      title="Customer Reviews"
      description="Moderate customer feedback, reply to reviews, and view store ratings."
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <span className="sr-only" role="status">Loading reviews…</span>
        {header}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
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

  const pendingCount = reviews?.filter((r) => r.status === 'PENDING').length || 0;

  return (
    <div className="space-y-6">
      {header}

      {/* Các thẻ thống kê đánh giá */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Overall Rating"
            value={stats.averageShopRating > 0 ? stats.averageShopRating : stats.averageProductRating || '0.0'}
            hint="out of 5.0"
            icon={Star}
          />
          <StatCard
            label="Pending Reviews"
            value={pendingCount}
            icon={Clock}
            tone={pendingCount > 0 ? 'warning' : 'default'}
          />
          <StatCard label="Product Reviews" value={stats.productCount} icon={ShoppingBag} />
          <StatCard label="Total Reviews" value={stats.totalCount} icon={MessageSquare} />
        </div>
      )}

      {/* Bộ lọc đánh giá */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          
          <FilterChip active={statusFilter === null} onClick={() => setStatusFilter(null)}>
            All Reviews
          </FilterChip>
          <FilterChip active={statusFilter === 'PENDING'} onClick={() => setStatusFilter('PENDING')}>
            Pending ({pendingCount})
          </FilterChip>
          <FilterChip active={statusFilter === 'APPROVED'} onClick={() => setStatusFilter('APPROVED')}>
            Approved
          </FilterChip>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">Rating:</span>
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

      {/* Danh sách các đánh giá */}
      {!reviews || reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews found"
          description="Try adjusting your filters or wait for buyers to submit feedback."
        />
      ) : (
        <div
          className={cn('space-y-4 transition-opacity', isPlaceholderData && 'opacity-60')}
          aria-busy={isPlaceholderData}
        >
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className={cn(
                'space-y-4 rounded-xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm',
                rev.status === 'PENDING' && 'border-blue-500/30',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-base text-foreground flex items-center gap-1.5">
                      <User className="h-4 w-4 text-muted-foreground/60" />
                      {rev.buyerName}
                    </span>
                    <span className="text-xs text-muted-foreground">({rev.buyerEmail})</span>
                    
                    {rev.isVerified && (
                      <Badge variant="success">Verified Purchase</Badge>
                    )}

                    {rev.status === 'PENDING' ? (
                      <Badge variant="info">Pending Moderation</Badge>
                    ) : (
                      <Badge variant="success">Approved & Live</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(rev.createdAt)}
                    </span>
                    
                    {rev.product ? (
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        Product: {rev.product.name}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-purple-600 font-medium">
                        <Award className="h-3.5 w-3.5" />
                        Shop Service Review
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-xl gap-1">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="text-xs font-bold">{rev.rating}</span>
                  </div>

                  {rev.status === 'PENDING' && (
                    <Button size="lg" onClick={() => approveMutation.mutate(rev.id)}>
                      <CheckCircle2 />
                      Approve
                    </Button>
                  )}

                  <Button
                    size="icon"
                    variant="ghost-destructive"
                    aria-label="Delete review"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this review?')) {
                        deleteMutation.mutate(rev.id);
                      }
                    }}
                  >
                    <Trash2 />
                  </Button>
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
                    placeholder="Thank the customer for their review, answer questions, or address complaints..."
                    className="resize-none rounded-xl"
                    rows={3}
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
                      <Reply className="h-3.5 w-3.5 shrink-0" />
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
                      <Reply className="h-3 w-3" /> Edit
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
                    <Reply className="h-3.5 w-3.5" />
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
