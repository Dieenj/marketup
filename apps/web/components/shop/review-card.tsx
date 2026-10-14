import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import StarRating from '@/components/star-rating';
import { formatDate } from '@/lib/format';
import type { PublicReview } from '@/lib/storefront-queries';

// Một đánh giá công khai: trang sản phẩm và tab Reviews của storefront.
// `productHref`: có thì hiện tên sản phẩm được đánh giá (tab Reviews gồm đánh giá của mọi sản phẩm).
export default function ReviewCard({
  review,
  productHref,
}: {
  review: PublicReview;
  productHref?: string;
}) {
  return (
    <article className="space-y-3 rounded-2xl border border-border/50 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{review.buyerName}</span>
            {/* Mọi đánh giá đều từ đơn đã giao */}
            <Badge variant="success">Verified Purchase</Badge>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {formatDate(review.createdAt)}
            {review.editedAt && ' · Edited'}
          </p>
        </div>

        <StarRating value={review.rating} starClassName="size-3.5" />
      </div>

      {productHref && review.product && (
        <Link
          href={productHref}
          prefetch={false}
          className="inline-block rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground hover:underline"
        >
          {review.product.name}
        </Link>
      )}

      {review.comment && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
          {review.comment}
        </p>
      )}

      {review.sellerReply && (
        <div className="mt-2.5 ml-6 space-y-1 rounded-r-xl border-l-2 border-primary bg-primary/5 p-4">
          <p className="text-xs font-bold text-primary">Shop Owner Response</p>
          <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {review.sellerReply}
          </p>
        </div>
      )}
    </article>
  );
}
