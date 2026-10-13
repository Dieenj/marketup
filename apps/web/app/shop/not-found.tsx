import ShopNotFoundView from '@/components/shop/shop-not-found';

// Shop không tồn tại: notFound() gọi ở app/shop/[slug]/layout.tsx được boundary của segment cha (file này) bắt
export default function ShopNotFound() {
  return <ShopNotFoundView />;
}
