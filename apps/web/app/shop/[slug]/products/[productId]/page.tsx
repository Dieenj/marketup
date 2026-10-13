import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import ProductClient from '../../_components/product-client';
import { storefrontQueries } from '@/lib/storefront-queries';
import {
  getStorefrontProduct,
  getStorefrontShop,
  makeServerQueryClient,
  serverFetcher,
} from '@/lib/storefront-server';

type Props = { params: Promise<{ slug: string; productId: string }> };

async function loadProduct(slug: string, productId: string) {
  const [shop, product] = await Promise.all([getStorefrontShop(slug), getStorefrontProduct(productId)]);
  // Sản phẩm phải thuộc đúng shop trên URL
  const belongsToShop =
    shop.status !== 'ok' || product.status !== 'ok' || !product.data.shopId || product.data.shopId === shop.data.id;
  const isNotFound = shop.status === 'not-found' || product.status === 'not-found' || !belongsToShop;
  return { shop, product, isNotFound };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, productId } = await params;
  const { shop, product, isNotFound } = await loadProduct(slug, productId);
  if (isNotFound || product.status !== 'ok') return { title: 'MarketUp' };

  const shopName = shop.status === 'ok' ? shop.data.name : undefined;
  const title = shopName ? `${product.data.name} — ${shopName}` : product.data.name;
  const description = product.data.description || (shopName ? `${product.data.name} at ${shopName}` : undefined);
  const image = product.data.images?.[0] || product.data.imageUrl || undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/shop/${slug}/products/${productId}`,
      ...(image && { images: [{ url: image }] }),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug, productId } = await params;
  const { shop, product, isNotFound } = await loadProduct(slug, productId);
  if (isNotFound) notFound();

  const q = storefrontQueries(serverFetcher);
  const queryClient = makeServerQueryClient();
  if (shop.status === 'ok') queryClient.setQueryData(q.shop(slug).queryKey, shop.data);
  if (product.status === 'ok') {
    queryClient.setQueryData(q.product(productId).queryKey, product.data);
    // Chỉ prefetch dữ liệu phụ khi API đang phản hồi — tránh cộng dồn thêm một lần timeout
    await Promise.all([
      queryClient.prefetchQuery(q.productReviews(productId)),
      queryClient.prefetchQuery(q.productRating(productId)),
    ]);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductClient />
    </HydrationBoundary>
  );
}
