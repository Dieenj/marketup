import { queryOptions } from '@tanstack/react-query';
import api, { getErrorStatus } from '@/lib/api-client';
import type { CancelReason } from '@/lib/order-status';

// Đơn hàng phía người mua — đúng các trường API /buyer/orders trả về (không có email/sđt hay id nội bộ)
export interface BuyerOrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string | null;
  variantLabel?: string | null;
  quantity: number;
  priceAtPurchase: string;
}

export interface BuyerOrder {
  orderNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: 'BUYER' | 'SELLER' | null;
  cancelReason?: CancelReason | null;
  cancelNote?: string | null;
  buyerName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingDistrict?: string | null;
  shippingNote?: string | null;
  subtotal: string;
  shippingFee: string;
  discount: string;
  totalAmount: string;
  items: BuyerOrderItem[];
  shop: { name: string; slug: string };
}

// Mỗi request tự gửi token của người mua: phiên đăng nhập, hoặc link của một đơn (?t=)
const withToken = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

// 401 = token hết hạn/không hợp lệ, 404 = không phải đơn của người này → cần đăng nhập lại, thử lại vô ích
export function isAccessDenied(error: unknown) {
  const status = getErrorStatus(error);
  return status === 401 || status === 404;
}

const retryUnlessDenied = (count: number, error: unknown) => !isAccessDenied(error) && count < 2;

export async function requestLoginCode(email: string, shopSlug: string) {
  const { data } = await api.post<{ resendInSeconds: number }>('/buyer/auth/request-code', {
    email,
    shopSlug,
  });
  return data;
}

export async function verifyLoginCode(email: string, code: string) {
  const { data } = await api.post<{ email: string; token: string }>('/buyer/auth/verify', {
    email,
    code,
  });
  return data;
}

// Người mua huỷ đơn khi shop chưa xác nhận; trả về đơn sau khi huỷ
export async function cancelOrder(
  orderNumber: string,
  token: string,
  input: { reason: CancelReason; note?: string },
) {
  const { data } = await api.post<BuyerOrder>(
    `/buyer/orders/${encodeURIComponent(orderNumber)}/cancel`,
    input,
    withToken(token),
  );
  return data;
}

export function myOrdersQuery(shopSlug: string, token: string) {
  return queryOptions({
    queryKey: ['buyer-orders', shopSlug, token],
    queryFn: async () =>
      (
        await api.get<BuyerOrder[]>('/buyer/orders', {
          params: { shop: shopSlug },
          ...withToken(token),
        })
      ).data,
    retry: retryUnlessDenied,
  });
}

export function buyerOrderQuery(orderNumber: string, token: string) {
  return queryOptions({
    queryKey: ['buyer-order', orderNumber, token],
    queryFn: async () =>
      (
        await api.get<BuyerOrder>(
          `/buyer/orders/${encodeURIComponent(orderNumber)}`,
          withToken(token),
        )
      ).data,
    retry: retryUnlessDenied,
  });
}
