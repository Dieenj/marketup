import {
  isWithinReviewWindow,
  maskBuyerName,
  REVIEW_WINDOW_DAYS,
  reviewDeadline,
} from './review-rules';

describe('review rules', () => {
  const delivered = new Date('2026-10-01T10:00:00Z');

  it('allows reviews for 30 days after delivery', () => {
    expect(REVIEW_WINDOW_DAYS).toBe(30);
    expect(reviewDeadline(delivered)?.toISOString()).toBe(
      '2026-10-31T10:00:00.000Z',
    );
    expect(
      isWithinReviewWindow(delivered, new Date('2026-10-31T09:59:59Z')),
    ).toBe(true);
    expect(
      isWithinReviewWindow(delivered, new Date('2026-10-31T10:00:00Z')),
    ).toBe(false);
  });

  it('has no window for orders that were never delivered', () => {
    expect(reviewDeadline(null)).toBeNull();
    expect(isWithinReviewWindow(null)).toBe(false);
  });

  it.each([
    ['Minh Tú', 'M***ú'],
    ['  Nguyễn Văn An ', 'N***n'],
    ['Al', 'A***'],
    ['X', 'X***'],
    ['   ', 'Buyer'],
  ])('masks %p as %p', (name, masked) => {
    expect(maskBuyerName(name)).toBe(masked);
  });
});
