import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import ShopLayoutClient from './_components/shop-layout-client';
import { storefrontQueries } from '@/lib/storefront-queries';
import { getStorefrontShop, makeServerQueryClient, serverFetcher } from '@/lib/storefront-server';
import { shareMetadata } from '@/lib/share-metadata';

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

// Tiêu đề + Open Graph để link shop chia sẻ lên mạng xã hội có bản xem trước đúng
export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { slug } = await params;
  const result = await getStorefrontShop(slug);
  if (result.status !== 'ok') {
    return { title: 'MarketUp' };
  }
  const shop = result.data;
  const title = `${shop.name} — MarketUp`;
  const description = shop.description || `Shop ${shop.name} on MarketUp`;
  const image = shop.bannerUrl || shop.logoUrl || undefined;
  return shareMetadata({ title, description, url: `/shop/${shop.slug}`, image });
}

export default async function ShopLayout({ children, params }: Props) {
  const { slug } = await params;
  const queryClient = makeServerQueryClient();
  const result = await getStorefrontShop(slug);
  // Kiểm tra ở layout (trước mọi loading.tsx bên trong) để shop không tồn tại vẫn trả HTTP 404 thật,
  // kể cả /shop/<slug>/checkout. Boundary bắt lỗi này là app/shop/not-found.tsx (segment cha).
  if (result.status === 'not-found') notFound();
  if (result.status === 'ok') {
    queryClient.setQueryData(storefrontQueries(serverFetcher).shop(slug).queryKey, result.data);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ShopLayoutClient>{children}</ShopLayoutClient>
    </HydrationBoundary>
  );
}
