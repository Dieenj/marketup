import { OrderStatus, Prisma } from '@prisma/client';

// Danh sách đơn kiểu Shopee: mới nhất trước, tab theo trạng thái, cuộn tới đâu tải tới đó
export const ORDER_PAGE_SIZE = 20;

// Thứ tự cố định để con trỏ luôn chỉ đúng vị trí, kể cả khi nhiều đơn trùng createdAt
const ORDER_LIST_ORDER_BY = [
  { createdAt: 'desc' },
  { id: 'desc' },
] satisfies Prisma.OrderOrderByWithRelationInput[];

// Con trỏ = đơn cuối của trang trước (người bán: id; người mua: mã đơn — API người mua không lộ id).
// Lấy dư một dòng để biết còn trang sau không.
export function pageArgs(cursor?: Prisma.OrderWhereUniqueInput) {
  return {
    orderBy: ORDER_LIST_ORDER_BY,
    take: ORDER_PAGE_SIZE + 1,
    ...(cursor && { cursor, skip: 1 }),
  };
}

export function toPage<T>(rows: T[], cursorOf: (row: T) => string) {
  const items = rows.slice(0, ORDER_PAGE_SIZE);
  return {
    items,
    nextCursor:
      rows.length > ORDER_PAGE_SIZE ? cursorOf(items[items.length - 1]) : null,
  };
}

export type StatusCounts = Record<'ALL' | OrderStatus, number>;

// Số đơn mỗi tab, kể cả tab không có đơn nào (= 0)
export function toStatusCounts(
  groups: { status: OrderStatus; _count: { _all: number } }[],
): StatusCounts {
  const counts = Object.fromEntries(
    [...Object.values(OrderStatus), 'ALL'].map((key) => [key, 0]),
  ) as StatusCounts;
  for (const { status, _count } of groups) {
    counts[status] = _count._all;
    counts.ALL += _count._all;
  }
  return counts;
}
