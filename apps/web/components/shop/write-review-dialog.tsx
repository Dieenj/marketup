'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Star, Loader2, MessageSquarePlus } from 'lucide-react';
import api from '@/lib/api-client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const reviewSchema = z.object({
  buyerName: z.string().min(2, 'Name must be at least 2 characters'),
  buyerEmail: z.string().email('Invalid email address'),
  comment: z.string().optional(),
});

interface WriteReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  productId?: string;
  productName?: string;
  onSuccess?: () => void;
}

export default function WriteReviewDialog({
  open,
  onOpenChange,
  shopId,
  productId,
  productName,
  onSuccess,
}: WriteReviewDialogProps) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { buyerName: '', buyerEmail: '', comment: '' },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof reviewSchema>) => {
      return api.post('/reviews', {
        shopId,
        productId: productId || null,
        rating,
        ...values,
      });
    },
    onSuccess: (data: any) => {
      const isVerified = data.data?.isVerified;
      toast.success(
        isVerified
          ? 'Review submitted successfully with a Verified Purchase badge!'
          : 'Review submitted successfully! It is pending shop owner approval.',
      );
      form.reset();
      setRating(5);
      onOpenChange(false);
      if (onSuccess) onSuccess();
      
      // Làm mới các truy vấn (Invalidate queries)
      if (productId) {
        queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
        queryClient.invalidateQueries({ queryKey: ['product-rating', productId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['shop-reviews', shopId] });
        queryClient.invalidateQueries({ queryKey: ['shop-stats', shopId] });
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to submit review. Please try again.',
      );
    },
  });

  const handleSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        form.reset();
        setRating(5);
      }
      onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
              <MessageSquarePlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                {productId ? 'Review Product' : 'Review Shop Service'}
              </DialogTitle>
              {productName && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[340px]">
                  For: {productName}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-5 py-2">
            {/* Bộ chọn đánh giá sao lấp lánh (Interactive Glowing Star Rating) */}
            <div className="flex flex-col items-center justify-center py-2.5 bg-[#fafafa] rounded-2xl border border-border/40 gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Your Rating
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isGold = hoverRating !== null ? star <= hoverRating : star <= rating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="transition-transform duration-100 hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`h-9.5 w-9.5 transition-colors ${
                          isGold
                            ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]'
                            : 'text-muted-foreground/30 fill-transparent'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-bold text-amber-600 mt-0.5">
                {rating === 5 && 'Excellent!'}
                {rating === 4 && 'Good!'}
                {rating === 3 && 'Average'}
                {rating === 2 && 'Poor'}
                {rating === 1 && 'Terrible'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="buyerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Display Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John D." className="h-10 rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buyerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="e.g. john@example.com"
                        className="h-10 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px] leading-tight" />
                  </FormItem>
                )}
              />
            </div>
            
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed -mt-1 bg-primary/5 p-2.5 rounded-xl border border-primary/10">
              💡 <strong>Purchase Verification:</strong> Enter the email address you used during checkout for this order. If it matches, your review will automatically receive a <strong>Verified Purchase</strong> badge!
            </p>

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Comments
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your experience — quality of items, shipping speed, packaging..."
                      rows={4}
                      className="resize-none rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl h-10"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="rounded-xl h-10 gap-2 font-bold px-6"
              >
                {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Review
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
