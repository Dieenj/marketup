// Các hằng số dùng chung cho trạng thái đơn hàng

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPING',
  'DELIVERED',
  'CANCELLED',
] as const;

// Danh sách đơn kiểu Shopee: tab "All" + từng trạng thái, mới nhất trước, tải từng trang
export const ORDER_TABS = ['ALL', ...ORDER_STATUSES] as const;
export type OrderTab = (typeof ORDER_TABS)[number];
export type OrderStatusCounts = Record<OrderTab, number>;

// Một trang danh sách đơn từ API; nextCursor = null khi hết; counts = số đơn mỗi tab
export interface OrderPage<T> {
  items: T[];
  nextCursor: string | null;
  counts: OrderStatusCounts;
}

export const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPING: 'Shipping',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  CONFIRMED: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  PROCESSING: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  SHIPPING: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  DELIVERED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  CANCELLED: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

export const statusDotColors: Record<string, string> = {
  PENDING: 'bg-amber-500',
  CONFIRMED: 'bg-blue-500',
  PROCESSING: 'bg-indigo-500',
  SHIPPING: 'bg-violet-500',
  DELIVERED: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
};

// Khớp SELLER_TRANSITIONS ở API (apps/api/src/order/order-status.ts)
export const nextStatuses: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED', 'CANCELLED'], // huỷ lúc đang giao = giao không thành công
  DELIVERED: [],
  CANCELLED: [],
};

export type CancelReason =
  | 'CHANGED_MIND'
  | 'WRONG_DETAILS'
  | 'FOUND_BETTER_PRICE'
  | 'OUT_OF_STOCK'
  | 'BUYER_UNREACHABLE'
  | 'DELIVERY_FAILED'
  | 'OTHER';

export const cancelReasonLabels: Record<CancelReason, string> = {
  CHANGED_MIND: 'Changed my mind',
  WRONG_DETAILS: 'Need to change the address or items',
  FOUND_BETTER_PRICE: 'Found a better price elsewhere',
  OUT_OF_STOCK: 'Out of stock',
  BUYER_UNREACHABLE: "Buyer couldn't be reached",
  DELIVERY_FAILED: 'Delivery was unsuccessful',
  OTHER: 'Other',
};

// Khớp BUYER_CANCEL_REASONS / sellerCancelReasons ở API
export const BUYER_CANCEL_REASONS: CancelReason[] = [
  'CHANGED_MIND',
  'WRONG_DETAILS',
  'FOUND_BETTER_PRICE',
  'OTHER',
];

export function sellerCancelReasons(status: string): CancelReason[] {
  if (status === 'SHIPPING') return ['DELIVERY_FAILED'];
  return ['OUT_OF_STOCK', 'BUYER_UNREACHABLE', 'OTHER'];
}
