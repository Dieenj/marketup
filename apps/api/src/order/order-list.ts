import { OrderStatus, Prisma } from '@prisma/client';
import { cursorPageArgs, toCursorPage } from '../common/cursor-page';

// Danh sách đơn kiểu Shopee: mới nhất trước, tab theo trạng thái, cuộn tới đâu tải tới đó
export const ORDER_PAGE_SIZE = 20;

// Người bán: con trỏ là id; người mua: mã đơn (API người mua không lộ id)
export const pageArgs = (cursor?: Prisma.OrderWhereUniqueInput) =>
  cursorPageArgs(ORDER_PAGE_SIZE, cursor);

export const toPage = <T>(rows: T[], cursorOf: (row: T) => string) =>
  toCursorPage(ORDER_PAGE_SIZE, rows, cursorOf);

type StatusCounts = Record<'ALL' | OrderStatus, number>;

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
