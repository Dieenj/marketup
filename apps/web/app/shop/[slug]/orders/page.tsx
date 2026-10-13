import type { Metadata } from 'next';
import { getStorefrontShop } from '@/lib/storefront-server';
import OrdersClient from './_components/orders-client';

type Props = { params: Promise<{ slug: string }> };

// Trang riêng của người mua (dữ liệu nằm trên thiết bị) → không cho index
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getStorefrontShop(slug);
  return {
    title: shop.status === 'ok' ? `My orders — ${shop.data.name}` : 'My orders',
    robots: { index: false },
  };
}

export default async function OrdersPage({ params }: Props) {
  const { slug } = await params;
  return <OrdersClient slug={slug} />;
}
