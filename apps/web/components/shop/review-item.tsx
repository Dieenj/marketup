import StarRating from '@/components/star-rating';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';

// Dữ liệu một đánh giá mà cả storefront lẫn dashboard đều có (tên người mua đã che)
interface ReviewItemData {
  buyerName: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  editedAt?: string | null;
  sellerReply?: string | null;
  variantLabel?: string | null;
}

// Một đánh giá trong danh sách, kiểu các trang bán hàng quen thuộc (Shopee, Amazon):
// không đóng khung — danh sách tự kẻ đường ngăn (divide-y) giữa các đánh giá.
// Dùng ở trang sản phẩm, tab Reviews của storefront và trang Reviews của người bán.
//   product: tên/link sản phẩm (khi danh sách gồm nhiều sản phẩm)
//   badge, meta: thêm cạnh tên / cuối dòng ngày (dashboard: "Needs reply", mã đơn)
//   replyLabel + replyAction: tiêu đề và nút trong ô trả lời của shop
//   children: thay cho ô trả lời (dashboard: ô soạn trả lời, nút "Reply")
export default function ReviewItem({
  review,
  product,
  badge,
  meta,
  replyLabel,
  replyAction,
  children,
  className,
}: {
  review: ReviewItemData;
  product?: React.ReactNode;
  badge?: React.ReactNode;
  meta?: React.ReactNode;
  replyLabel: string;
  replyAction?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={cn('flex gap-3 py-5', className)}>
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
      >
        {review.buyerName.charAt(0).toUpperCase()}
      </span>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium">{review.buyerName}</span>
            {badge}
          </div>
          <StarRating value={review.rating} starClassName="size-3.5" />
          <p className="text-xs text-muted-foreground">
            {formatDate(review.createdAt)}
            {review.variantLabel && ` | Variation: ${review.variantLabel}`}
            {review.editedAt && ' · Edited'}
            {meta}
          </p>
        </div>

        {product}

        {review.comment && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{review.comment}</p>
        )}

        {children ??
          (review.sellerReply && (
            <div className="rounded-lg bg-muted/70 px-3.5 py-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-xs font-medium">{replyLabel}</p>
                {replyAction}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {review.sellerReply}
              </p>
            </div>
          ))}
      </div>
    </article>
  );
}

// Điểm trung bình + số đánh giá ở đầu danh sách (trang sản phẩm, tab Reviews).
// "Đã mua hàng" ghi một lần ở đây thay vì gắn nhãn vào từng đánh giá: mọi đánh giá đều từ đơn đã giao.
// children: bộ lọc (tab Reviews lọc theo số sao)
export function ReviewSummary({
  average,
  count,
  children,
}: {
  average: number;
  count: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:gap-8',
        !children && 'sm:w-fit sm:pr-8',
      )}
    >
      <div className="flex items-center gap-3 sm:min-w-64">
        <span className="text-4xl font-bold tabular-nums">
          {count > 0 ? average.toFixed(1) : '–'}
        </span>
        <div className="space-y-0.5">
          <StarRating value={average} starClassName="size-4" />
          <p className="text-xs text-muted-foreground">
            {count} {count === 1 ? 'review' : 'reviews'} from customers who received their order
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
