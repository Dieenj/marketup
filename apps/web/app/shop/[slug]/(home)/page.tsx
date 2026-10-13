import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import StorefrontClient from '../_components/storefront-client';
import { storefrontQueries } from '@/lib/storefront-queries';
import { getStorefrontShop, makeServerQueryClient, serverFetcher } from '@/lib/storefront-server';

export default async function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Shop không tồn tại đã bị layout chặn (404 thật). Khi tải trang đầy đủ, cache() dùng lại kết quả của layout.
  const result = await getStorefrontShop(slug);

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
