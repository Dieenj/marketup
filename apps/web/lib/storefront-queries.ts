import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
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
  bannerFocusX?: number; // vị trí ảnh banner trong khung, % (50 = giữa)
  bannerFocusY?: number;
  primaryColor?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  categories?: StorefrontCategory[];
}

// Đánh giá công khai (tên người mua đã che)
export interface PublicReview {
  id: string;
  buyerName: string;
  rating: number;
  comment?: string | null;
  editedAt?: string | null;
  sellerReply?: string | null;
  createdAt: string;
  product?: { id: string; name: string } | null;
}

export type RatingCounts = Record<1 | 2 | 3 | 4 | 5, number>;

// Điểm shop = trung bình mọi đánh giá sản phẩm, kèm số đánh giá mỗi mức sao
export interface ShopStats {
  averageRating: number;
  count: number;
  ratingCounts?: RatingCounts;
}

export interface ReviewPage {
  items: PublicReview[];
  nextCursor: string | null;
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
    shopStats: (shopId: string) =>
      queryOptions({
        queryKey: ['shop-stats', shopId],
        queryFn: () => fetcher<ShopStats>(`/reviews/shop/${shopId}/stats`),
      }),
    // Tab Reviews: mới nhất trước, từng trang 10 đánh giá; `rating` lọc theo số sao
    shopReviews: (shopId: string, rating?: number) =>
      infiniteQueryOptions({
        queryKey: ['shop-reviews', shopId, rating ?? 'all'],
        queryFn: ({ pageParam }) => {
          const params = new URLSearchParams();
          if (rating) params.set('rating', String(rating));
          if (pageParam) params.set('cursor', pageParam);
          const query = params.size ? `?${params}` : '';
          return fetcher<ReviewPage>(`/reviews/shop/${shopId}${query}`);
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
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
