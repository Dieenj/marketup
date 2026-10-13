import { Prisma } from '@prisma/client';

const DAY = 24 * 60 * 60 * 1000;
// Shop bán ở Việt Nam (UTC+7, không đổi giờ) → "hôm nay" theo giờ Việt Nam, không theo giờ server (UTC)
const VN_OFFSET = 7 * 60 * 60 * 1000;

const vnDayKey = (date: Date) =>
  new Date(date.getTime() + VN_OFFSET).toISOString().slice(0, 10);

// 0h giờ Việt Nam của ngày cách `now` `daysAgo` ngày
export function vnStartOfDay(now: Date, daysAgo = 0) {
  const key = vnDayKey(new Date(now.getTime() - daysAgo * DAY));
  return new Date(Date.parse(`${key}T00:00:00Z`) - VN_OFFSET);
}

// Doanh thu theo ngày giao hàng (đơn DELIVERED) trong `days` ngày gần nhất, kể cả hôm nay
export function buildRevenueTrend(
  delivered: { deliveredAt: Date | null; totalAmount: Prisma.Decimal }[],
  now: Date,
  days = 7,
) {
  const totals = new Map<string, Prisma.Decimal>();
  for (const order of delivered) {
    if (!order.deliveredAt) continue;
    const key = vnDayKey(order.deliveredAt);
    totals.set(
      key,
      (totals.get(key) ?? new Prisma.Decimal(0)).add(order.totalAmount),
    );
  }

  return Array.from({ length: days }, (_, i) => {
    const start = vnStartOfDay(now, days - 1 - i);
    return {
      date: start.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'Asia/Ho_Chi_Minh',
      }),
      revenue: Number(totals.get(vnDayKey(start)) ?? 0),
    };
  });
}
