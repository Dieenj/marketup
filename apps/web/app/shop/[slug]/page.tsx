import { notFound } from 'next/navigation';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import StorefrontClient from './_components/storefront-client';
import { storefrontQueries } from '@/lib/storefront-queries';
import { getStorefrontShop, makeServerQueryClient, serverFetcher } from '@/lib/storefront-server';

export default async function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getStorefrontShop(slug);
  // API xác nhận không có shop → trả HTTP 404 (không để crawler index trang rỗng)
  if (result.status === 'not-found') notFound();

  const queryClient = makeServerQueryClient();
  if (result.status === 'ok') {
    const q = storefrontQueries(serverFetcher);
    const shop = result.data;
    queryClient.setQueryData(q.shop(slug).queryKey, shop);
    // Lỗi/timeout ở đây được bỏ qua: query thiếu dữ liệu sẽ được client tự fetch
    await Promise.all([
      queryClient.prefetchQuery(q.products(shop.id)),
      queryClient.prefetchQuery(q.shopStats(shop.id)),
      queryClient.prefetchQuery(q.shopReviews(shop.id)),
    ]);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StorefrontClient />
    </HydrationBoundary>
  );
}
