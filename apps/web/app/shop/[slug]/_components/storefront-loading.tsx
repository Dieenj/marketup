'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { storefrontQueries } from '@/lib/storefront-queries';
import { StorefrontSkeleton } from './skeletons';

const q = storefrontQueries();

// loading.tsx là server component nên không nhận được dữ liệu shop; layout đã đưa shop vào cache
// React Query (HydrationBoundary bọc cả vùng loading) → đọc lại ở đây để hero hiện thật ngay
export default function StorefrontLoading() {
  const { slug } = useParams<{ slug: string }>();
  const { data: shop } = useQuery(q.shop(slug));
  return <StorefrontSkeleton shop={shop} />;
}
