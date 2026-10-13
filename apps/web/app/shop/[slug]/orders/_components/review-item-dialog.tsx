'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { BuyerReview, WriteReviewInput } from '@/lib/buyer-api';

const MAX_COMMENT = 2000;
const RATING_WORDS = ['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

interface ReviewItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  /** Có = đang sửa (chỉ được sửa một lần) */
  existing?: BuyerReview | null;
  onSubmit: (input: WriteReviewInput) => void;
  isPending: boolean;
}

// Đánh giá một sản phẩm trong đơn đã giao (mở từ trang đơn hàng)
export default function ReviewItemDialog({ open, onOpenChange, ...props }: ReviewItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        {/* Nội dung bị gỡ khi đóng → lần mở sau bắt đầu lại từ giá trị hiện tại */}
        <ReviewForm onClose={() => onOpenChange(false)} {...props} />
      </DialogContent>
    </Dialog>
  );
}

function ReviewForm({
  productName,
  existing,
  onSubmit,
  isPending,
  onClose,
}: Omit<ReviewItemDialogProps, 'open' | 'onOpenChange'> & { onClose: () => void }) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState<number | null>(null);
  const [comment, setComment] = useState(existing?.comment ?? '');
  const shown = hover ?? rating;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{existing ? 'Edit your review' : 'Rate this item'}</DialogTitle>
        <DialogDescription>
          {productName}
          {existing && ' · You can edit a review once.'}
        </DialogDescription>
      </DialogHeader>

      <form
        id="review-item-form"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (rating) onSubmit({ rating, comment: comment.trim() || undefined });
        }}
      >
        <div className="flex flex-col items-center gap-1.5 rounded-xl border bg-muted/30 py-3">
          <div role="radiogroup" aria-label="Rating" className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={rating === star}
                aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(null)}
                className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Star
                  aria-hidden
                  className={cn(
                    'size-8 transition-colors',
                    star <= shown
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-transparent text-muted-foreground/30',
                  )}
                />
              </button>
            ))}
          </div>
          <span className="h-4 text-xs font-semibold text-amber-600">{RATING_WORDS[shown]}</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-comment">
            Your review <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={MAX_COMMENT}
            rows={4}
            placeholder="How was the quality, fit, packaging…?"
            className="resize-none"
          />
        </div>
      </form>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form="review-item-form" disabled={!rating || isPending}>
          {isPending && <Spinner />}
          {existing ? 'Save changes' : 'Submit review'}
        </Button>
      </DialogFooter>
    </>
  );
}
