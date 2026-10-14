import {
  REVIEW_PAGE_SIZE,
  reviewPageArgs,
  toRatingCounts,
  toReviewPage,
} from './review-list';

const rows = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `r${i + 1}` }));

describe('shop review paging', () => {
  it('asks for one extra row and continues after the cursor', () => {
    expect(reviewPageArgs()).toEqual({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: REVIEW_PAGE_SIZE + 1,
    });
    expect(reviewPageArgs('r9')).toMatchObject({
      cursor: { id: 'r9' },
      skip: 1,
    });
  });

  it('returns a cursor only when there is another page', () => {
    expect(toReviewPage(rows(REVIEW_PAGE_SIZE))).toEqual({
      items: rows(REVIEW_PAGE_SIZE),
      nextCursor: null,
    });
    const page = toReviewPage(rows(REVIEW_PAGE_SIZE + 1));
    expect(page.items).toHaveLength(REVIEW_PAGE_SIZE);
    expect(page.nextCursor).toBe(`r${REVIEW_PAGE_SIZE}`);
  });

  it('counts every star level, including empty ones', () => {
    expect(
      toRatingCounts([
        { rating: 5, _count: { _all: 3 } },
        { rating: 2, _count: { _all: 1 } },
      ]),
    ).toEqual({ 1: 0, 2: 1, 3: 0, 4: 0, 5: 3 });
  });
});
