import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Người mua không có tài khoản → thiết bị nhớ các đơn đã đặt (mã đơn + email) để mở lại "My orders"
// mà không phải nhập lại. Email chỉ nằm trên máy người mua; API vẫn kiểm tra mã đơn + email mỗi lần xem.
export interface RecentOrder {
  shopSlug: string;
  orderNumber: string;
  email: string;
}

const MAX_RECENT_ORDERS = 50;

interface RecentOrdersState {
  orders: RecentOrder[];
  remember: (order: RecentOrder) => void;
  forget: (shopSlug: string, orderNumber: string) => void;
}

const isSame = (a: RecentOrder, shopSlug: string, orderNumber: string) =>
  a.shopSlug === shopSlug && a.orderNumber === orderNumber;

export const useRecentOrdersStore = create<RecentOrdersState>()(
  persist(
    (set) => ({
      orders: [],
      // Mới nhất lên đầu; đơn đã có thì đưa lên đầu và cập nhật email
      remember: (order) =>
        set((state) => ({
          orders: [
            order,
            ...state.orders.filter((o) => !isSame(o, order.shopSlug, order.orderNumber)),
          ].slice(0, MAX_RECENT_ORDERS),
        })),
      forget: (shopSlug, orderNumber) =>
        set((state) => ({ orders: state.orders.filter((o) => !isSame(o, shopSlug, orderNumber)) })),
    }),
    { name: 'recent-orders' },
  ),
);
