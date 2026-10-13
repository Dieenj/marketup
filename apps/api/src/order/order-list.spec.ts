import {
  ORDER_PAGE_SIZE,
  pageArgs,
  toPage,
  toStatusCounts,
} from './order-list';

const rows = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `o${i + 1}` }));
const byId = (row: { id: string }) => row.id;

describe('order list paging', () => {
  it('asks for one extra row and continues after the cursor', () => {
    expect(pageArgs()).toEqual({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: ORDER_PAGE_SIZE + 1,
    });
    expect(pageArgs({ orderNumber: 'ORD-1' })).toMatchObject({
      cursor: { orderNumber: 'ORD-1' },
      skip: 1,
    });
  });

  it('returns a cursor only when there is another page', () => {
    expect(toPage(rows(ORDER_PAGE_SIZE), byId)).toEqual({
      items: rows(ORDER_PAGE_SIZE),
      nextCursor: null,
    });
    const page = toPage(rows(ORDER_PAGE_SIZE + 1), byId);
    expect(page.items).toHaveLength(ORDER_PAGE_SIZE);
    expect(page.nextCursor).toBe(`o${ORDER_PAGE_SIZE}`);
    expect(toPage([], byId)).toEqual({ items: [], nextCursor: null });
  });

  it('counts every status tab, including empty ones', () => {
    expect(
      toStatusCounts([
        { status: 'PENDING', _count: { _all: 2 } },
        { status: 'DELIVERED', _count: { _all: 5 } },
      ]),
    ).toEqual({
      ALL: 7,
      PENDING: 2,
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPING: 0,
      DELIVERED: 5,
      CANCELLED: 0,
    });
  });
});
