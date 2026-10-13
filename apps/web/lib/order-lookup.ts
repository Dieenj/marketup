import { queryOptions } from '@tanstack/react-query';
import api, { getErrorStatus } from '@/lib/api-client';

// Đơn hàng phía người mua — đúng các trường POST /orders/lookup trả về (không có email/sđt hay id nội bộ)
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

export interface OrderLookupInput {
  shopSlug: string;
  orderNumber: string;
  email: string;
}

export async function lookupOrder(input: OrderLookupInput) {
  return (await api.post<BuyerOrder>('/orders/lookup', input)).data;
}

export function orderLookupQuery(input: OrderLookupInput) {
  return queryOptions({
    queryKey: ['order-lookup', input.shopSlug, input.orderNumber, input.email],
    queryFn: () => lookupOrder(input),
    // 404 = sai mã/email hoặc đơn không còn → thử lại cũng vô ích
    retry: (count, error) => getErrorStatus(error) !== 404 && count < 2,
  });
}
