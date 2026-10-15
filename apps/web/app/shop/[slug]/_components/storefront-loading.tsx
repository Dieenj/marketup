'use client';

import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { storefrontQueries } from '@/lib/storefront-queries';
import { StorefrontSkeleton } from './skeletons';

const q = storefrontQueries();

// loading.tsx là server component nên không nhận được dữ liệu shop; layout đã đưa shop vào cache
// React Query (HydrationBoundary bọc cả vùng loading) → đọc lại ở đây để hero hiện thật ngay.
// Điểm đánh giá trên hero: chỉ ĐỌC cache (có sẵn nếu đã vào shop trước đó), chưa có thì hero giữ chỗ.
// Không useQuery: khi server render, loading.tsx chạy trước trang — tạo query rỗng ở đây khiến
// HydrationBoundary của trang hoãn nạp dữ liệu stats → server render thiếu điểm → lỗi hydration.
export default function StorefrontLoading() {
  const { slug } = useParams<{ slug: string }>();
  const { data: shop } = useQuery(q.shop(slug));
  const stats = useQueryClient().getQueryData(q.shopStats(shop?.id ?? '').queryKey);
  return <StorefrontSkeleton shop={shop} rating={stats?.averageRating} />;
}
