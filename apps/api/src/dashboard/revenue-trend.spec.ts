import { Prisma } from '@prisma/client';
import { buildRevenueTrend, vnStartOfDay } from './revenue-trend';

const money = (n: number) => new Prisma.Decimal(n);

describe('revenue trend', () => {
  // 13/10/2026 01:30 giờ Việt Nam = 12/10 18:30 UTC
  const now = new Date('2026-10-12T18:30:00Z');

  it('starts the day at midnight Vietnam time, not UTC', () => {
    expect(vnStartOfDay(now).toISOString()).toBe('2026-10-12T17:00:00.000Z');
    expect(vnStartOfDay(now, 6).toISOString()).toBe('2026-10-06T17:00:00.000Z');
  });

  it('buckets delivered revenue by Vietnam delivery day', () => {
    const trend = buildRevenueTrend(
      [
        // 13/10 00:15 giờ VN → hôm nay (theo UTC thì vẫn là 12/10)
        {
          deliveredAt: new Date('2026-10-12T17:15:00Z'),
          totalAmount: money(10.5),
        },
        {
          deliveredAt: new Date('2026-10-12T18:00:00Z'),
          totalAmount: money(4.5),
        },
        // 12/10 23:59 giờ VN → hôm qua
        {
          deliveredAt: new Date('2026-10-12T16:59:00Z'),
          totalAmount: money(7),
        },
        { deliveredAt: null, totalAmount: money(99) },
      ],
      now,
    );
    expect(trend).toHaveLength(7);
    expect(trend[6]).toEqual({ date: 'Tue, Oct 13', revenue: 15 });
    expect(trend[5]).toEqual({ date: 'Mon, Oct 12', revenue: 7 });
    expect(trend[0].date).toBe('Wed, Oct 7');
    expect(trend.slice(0, 5).every((d) => d.revenue === 0)).toBe(true);
  });
});
