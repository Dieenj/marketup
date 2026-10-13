import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import api, { getErrorStatus } from '@/lib/api-client';
import type { CancelReason, OrderPage, OrderTab } from '@/lib/order-status';

// Đơn hàng phía người mua — đúng các trường API /buyer/orders trả về (không có email/sđt hay id nội bộ)
// Đánh giá của chính người mua cho một sản phẩm trong đơn
export interface BuyerReview {
  id: string;
  rating: number;
  comment?: string | null;
  editedAt?: string | null;
  sellerReply?: string | null;
  createdAt: string;
}

export interface WriteReviewInput {
  rating: number;
  comment?: string;
}

export interface BuyerOrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string | null;
  variantLabel?: string | null;
  quantity: number;
  priceAtPurchase: string;
  review: BuyerReview | null;
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
  /** Hạn viết/sửa đánh giá (API tính: giao hàng + 30 ngày); null khi chưa giao */
  reviewableUntil: string | null;
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

// Viết (POST) hoặc sửa một lần (PATCH) đánh giá cho một sản phẩm trong đơn đã giao
export async function saveReview(
  orderNumber: string,
  itemId: string,
  token: string,
  input: WriteReviewInput,
  isEdit: boolean,
) {
  const url = `/buyer/orders/${encodeURIComponent(orderNumber)}/items/${encodeURIComponent(itemId)}/review`;
  const { data } = isEdit
    ? await api.patch<BuyerReview>(url, input, withToken(token))
    : await api.post<BuyerReview>(url, input, withToken(token));
  return data;
}

// Đơn của người mua trong shop, theo tab trạng thái; mới nhất trước, từng trang 20 đơn
export function myOrdersQuery(shopSlug: string, token: string, tab: OrderTab) {
  return infiniteQueryOptions({
    queryKey: ['buyer-orders', shopSlug, token, tab],
    queryFn: async ({ pageParam }) =>
      (
        await api.get<OrderPage<BuyerOrder>>('/buyer/orders', {
          params: {
            shop: shopSlug,
            status: tab === 'ALL' ? undefined : tab,
            cursor: pageParam,
          },
          ...withToken(token),
        })
      ).data,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
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
