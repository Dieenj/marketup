import {
  BUYER_CANCEL_REASONS,
  canBuyerCancel,
  SELLER_TRANSITIONS,
  sellerCancelReasons,
} from './order-status';

describe('order status rules', () => {
  it('lets the shop move orders forward one step at a time', () => {
    expect(SELLER_TRANSITIONS.PENDING).toContain('CONFIRMED');
    expect(SELLER_TRANSITIONS.PENDING).not.toContain('SHIPPING');
    expect(SELLER_TRANSITIONS.SHIPPING).toContain('DELIVERED');
    expect(SELLER_TRANSITIONS.DELIVERED).toEqual([]);
    expect(SELLER_TRANSITIONS.CANCELLED).toEqual([]);
  });

  it('only allows "delivery failed" once the order is on its way', () => {
    expect(sellerCancelReasons('SHIPPING')).toEqual(['DELIVERY_FAILED']);
    for (const status of ['PENDING', 'CONFIRMED', 'PROCESSING'] as const) {
      expect(sellerCancelReasons(status)).not.toContain('DELIVERY_FAILED');
      expect(sellerCancelReasons(status)).toContain('OUT_OF_STOCK');
    }
  });

  it('cannot cancel finished orders', () => {
    expect(sellerCancelReasons('DELIVERED')).toEqual([]);
    expect(sellerCancelReasons('CANCELLED')).toEqual([]);
  });

  it('lets buyers cancel only before the shop confirms, with buyer reasons', () => {
    expect(canBuyerCancel('PENDING')).toBe(true);
    for (const status of [
      'CONFIRMED',
      'PROCESSING',
      'SHIPPING',
      'DELIVERED',
      'CANCELLED',
    ] as const) {
      expect(canBuyerCancel(status)).toBe(false);
    }
    expect(BUYER_CANCEL_REASONS).not.toContain('OUT_OF_STOCK');
    expect(BUYER_CANCEL_REASONS).not.toContain('DELIVERY_FAILED');
  });
});
