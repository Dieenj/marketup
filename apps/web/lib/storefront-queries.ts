import { queryOptions } from '@tanstack/react-query';
import api from '@/lib/api-client';

// Các query công khai của storefront, dùng chung cho Server Component (prefetch) và Client Component.
// Mỗi trang truyền kiểu dữ liệu của mình qua generic, ví dụ `q.products<Product>(shopId)`.
// Key được tách riêng khỏi dashboard: ví dụ dashboard dùng ['products', shopId] cho /manage (gồm sản phẩm ẩn).

export type Fetcher = <T>(path: string) => Promise<T>;

const clientFetcher: Fetcher = async <T>(path: string) => (await api.get<T>(path)).data;

export interface StorefrontCategory {
  id: string;
  name: string;
}

export interface StorefrontShop {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  categories?: StorefrontCategory[];
}

export function storefrontQueries(fetcher: Fetcher = clientFetcher) {
  return {
    shop: (slug: string) =>
      queryOptions({
        queryKey: ['shop', slug],
        queryFn: () => fetcher<StorefrontShop>(`/shops/${encodeURIComponent(slug)}`),
      }),
    products: <T = unknown>(shopId: string) =>
      queryOptions({
        queryKey: ['storefront-products', shopId],
        queryFn: () => fetcher<T[]>(`/products/shop/${shopId}`),
      }),
    shopStats: <T = unknown>(shopId: string) =>
      queryOptions({
        queryKey: ['shop-stats', shopId],
        queryFn: () => fetcher<T>(`/reviews/shop/${shopId}/stats`),
      }),
    shopReviews: <T = unknown>(shopId: string) =>
      queryOptions({
        queryKey: ['shop-reviews', shopId],
        queryFn: () => fetcher<T[]>(`/reviews/shop/${shopId}?limit=3&status=APPROVED`),
      }),
    product: <T = unknown>(productId: string) =>
      queryOptions({
        queryKey: ['product', productId],
        queryFn: () => fetcher<T>(`/products/${encodeURIComponent(productId)}`),
      }),
    productReviews: <T = unknown>(productId: string) =>
      queryOptions({
        queryKey: ['product-reviews', productId],
        queryFn: () => fetcher<T[]>(`/reviews/product/${encodeURIComponent(productId)}`),
      }),
    productRating: <T = unknown>(productId: string) =>
      queryOptions({
        queryKey: ['product-rating', productId],
        queryFn: () => fetcher<T>(`/reviews/product/${encodeURIComponent(productId)}/rating`),
      }),
  };
}
