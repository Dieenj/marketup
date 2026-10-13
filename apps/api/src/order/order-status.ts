import type { CancelReason, OrderStatus } from '@prisma/client';

// Shop chuyển trạng thái theo đúng thứ tự; DELIVERED và CANCELLED là trạng thái cuối
export const SELLER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED', 'CANCELLED'], // huỷ lúc đang giao = giao không thành công
  DELIVERED: [],
  CANCELLED: [],
};

export const BUYER_CANCEL_REASONS: readonly CancelReason[] = [
  'CHANGED_MIND',
  'WRONG_DETAILS',
  'FOUND_BETTER_PRICE',
  'OTHER',
];

// Giống Shopee: hàng đã rời kho thì chỉ có thể là "giao không thành công"
export function sellerCancelReasons(
  status: OrderStatus,
): readonly CancelReason[] {
  if (status === 'SHIPPING') return ['DELIVERY_FAILED'];
  if (SELLER_TRANSITIONS[status].includes('CANCELLED')) {
    return ['OUT_OF_STOCK', 'BUYER_UNREACHABLE', 'OTHER'];
  }
  return [];
}

// Người mua tự huỷ được khi shop chưa xác nhận; sau đó phải liên hệ shop
export const canBuyerCancel = (status: OrderStatus) => status === 'PENDING';
