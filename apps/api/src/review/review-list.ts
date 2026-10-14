import { cursorPageArgs, toCursorPage } from '../common/cursor-page';

// Đánh giá của shop trên storefront: mới nhất trước, cuộn tới đâu tải tới đó (con trỏ = id đánh giá)
export const REVIEW_PAGE_SIZE = 10;

export const reviewPageArgs = (cursor?: string) =>
  cursorPageArgs(REVIEW_PAGE_SIZE, cursor ? { id: cursor } : undefined);

export const toReviewPage = <T extends { id: string }>(rows: T[]) =>
  toCursorPage(REVIEW_PAGE_SIZE, rows, (row) => row.id);

type RatingCounts = Record<1 | 2 | 3 | 4 | 5, number>;

// Số đánh giá mỗi mức sao (nút lọc), kể cả mức chưa có đánh giá nào (= 0)
export function toRatingCounts(
  groups: { rating: number; _count: { _all: number } }[],
): RatingCounts {
  const counts: RatingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const { rating, _count } of groups) {
    if (rating in counts) counts[rating as keyof RatingCounts] = _count._all;
  }
  return counts;
}
