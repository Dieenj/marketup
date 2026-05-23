'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import api from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
  AlertCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

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
  const { user } = useAuthStore();
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // 1. Fetch Seller's Shop
  const { data: shop } = useQuery({
    queryKey: ['my-shop'],
    queryFn: async () => {
      const { data } = await api.get('/shops/my-shop');
      return data;
    },
    enabled: !!user,
  });

  // 2. Fetch Reviews for Moderation
  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ['manage-reviews', shop?.id, ratingFilter, statusFilter],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (ratingFilter) params.rating = ratingFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get(`/reviews/manage/${shop.id}`, { params });
      return data;
    },
    enabled: !!shop?.id,
  });

  // 3. Fetch Shop General Ratings stats
  const { data: stats } = useQuery({
    queryKey: ['shop-stats', shop?.id],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/shop/${shop.id}/stats`);
      return data;
    },
    enabled: !!shop?.id,
  });

  // 4. Mutations
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  const pendingCount = reviews?.filter((r) => r.status === 'PENDING').length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customer Reviews</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Moderate customer feedback, reply to reviews, and view store ratings.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-border/60 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Overall Rating</p>
              <h3 className="text-2xl font-extrabold mt-1 flex items-baseline gap-1">
                {stats.averageShopRating > 0 ? stats.averageShopRating : stats.averageProductRating || '0.0'}
                <span className="text-xs font-normal text-muted-foreground">/ 5.0</span>
              </h3>
            </div>
            <div className="h-10 w-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
              <Star className="h-5 w-5 fill-current" />
            </div>
          </div>

          <div className="bg-white border border-border/60 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending Reviews</p>
              <h3 className="text-2xl font-extrabold mt-1 text-primary">{pendingCount}</h3>
            </div>
            <div className="h-10 w-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white border border-border/60 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Product Reviews</p>
              <h3 className="text-2xl font-extrabold mt-1">{stats.productCount}</h3>
            </div>
            <div className="h-10 w-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white border border-border/60 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Reviews</p>
              <h3 className="text-2xl font-extrabold mt-1">{stats.totalCount}</h3>
            </div>
            <div className="h-10 w-10 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-border/60 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              statusFilter === null
                ? 'bg-[#111111] text-white border-[#111111]'
                : 'bg-white text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
            }`}
          >
            All Reviews
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              statusFilter === 'PENDING'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
            }`}
          >
            Approved
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">Rating:</span>
          {[null, 5, 4, 3, 2, 1].map((stars) => (
            <button
              key={String(stars)}
              onClick={() => setRatingFilter(stars)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                ratingFilter === stars
                  ? 'bg-[#111111] text-white'
                  : 'bg-[#f5f5f5] hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {stars === null ? 'All' : `${stars} ★`}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {!reviews || reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-20 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="font-semibold text-muted-foreground">No reviews found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Try adjusting your filters or wait for buyers to submit feedback.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className={`bg-white border rounded-2xl p-5 transition-shadow hover:shadow-sm space-y-4 ${
                rev.status === 'PENDING' ? 'border-blue-200 bg-blue-50/5' : 'border-border/60'
              }`}
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
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Verified Purchase
                      </span>
                    )}

                    {rev.status === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded-full animate-pulse">
                        Pending Moderation
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Approved & Live
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(rev.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
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
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(rev.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5 h-8 px-3"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this review?')) {
                        deleteMutation.mutate(rev.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {rev.comment && (
                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap pl-6 border-l-2 border-muted">
                  {rev.comment}
                </p>
              )}

              {/* Replying input area */}
              {replyingId === rev.id ? (
                <div className="bg-[#fafafa] border rounded-xl p-4 space-y-3 ml-6 animate-in fade-in duration-200">
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
