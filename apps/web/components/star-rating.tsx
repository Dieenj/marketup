import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// Hiển thị điểm đánh giá 0–5 dưới dạng hàng sao (chỉ đọc).
// Điểm trung bình được làm tròn để 4.6 hiện 5 sao, giống nhau ở mọi trang.
export default function StarRating({
  value,
  className,
  starClassName = 'size-4',
}: {
  value: number;
  className?: string;
  starClassName?: string;
}) {
  const filled = Math.round(value);
  return (
    <div
      role="img"
      aria-label={`${value} out of 5 stars`}
      className={cn('flex items-center', className)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden
          className={cn(
            starClassName,
            star <= filled
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted text-muted-foreground/30',
          )}
        />
      ))}
    </div>
  );
}
