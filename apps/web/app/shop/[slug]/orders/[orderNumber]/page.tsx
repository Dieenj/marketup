import type { Metadata } from 'next';
import { getStorefrontShop } from '@/lib/storefront-server';
import OrderDetailClient from '../_components/order-detail-client';

type Props = { params: Promise<{ slug: string; orderNumber: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, orderNumber } = await params;
  const shop = await getStorefrontShop(slug);
  const title = `Order ${orderNumber.toUpperCase()}`;
  return {
    title: shop.status === 'ok' ? `${title} — ${shop.data.name}` : title,
    robots: { index: false },
  };
}

export default async function OrderPage({ params }: Props) {
  const { slug, orderNumber } = await params;
  // Mã đơn lưu và tra cứu ở dạng chữ hoa (link gõ tay có thể là chữ thường)
  return <OrderDetailClient slug={slug} orderNumber={orderNumber.toUpperCase()} />;
}
