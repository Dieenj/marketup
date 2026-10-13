// Người mua đánh giá / sửa đánh giá trong 30 ngày kể từ khi đơn được giao (giống Shopee)
export const REVIEW_WINDOW_DAYS = 30;

const DAY = 24 * 60 * 60 * 1000;

export function reviewDeadline(deliveredAt: Date | null): Date | null {
  return deliveredAt
    ? new Date(deliveredAt.getTime() + REVIEW_WINDOW_DAYS * DAY)
    : null;
}

export function isWithinReviewWindow(
  deliveredAt: Date | null,
  now = new Date(),
) {
  const deadline = reviewDeadline(deliveredAt);
  return !!deadline && now < deadline;
}

// Tên công khai trên đánh giá được che như Shopee: "Minh Tú" → "M***ú"
export function maskBuyerName(name: string) {
  const chars = Array.from(name.trim());
  if (chars.length === 0) return 'Buyer';
  if (chars.length <= 2) return `${chars[0]}***`;
  return `${chars[0]}***${chars[chars.length - 1]}`;
}
