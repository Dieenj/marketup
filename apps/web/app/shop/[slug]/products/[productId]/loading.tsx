import ScrollToTop from '@/components/scroll-to-top';
import { ProductDetailSkeleton } from '../../_components/skeletons';

// Hiện ngay khi bấm vào sản phẩm trong lúc server chờ API (Render có thể khởi động chậm)
export default function Loading() {
  return (
    <>
      <ScrollToTop />
      <ProductDetailSkeleton />
    </>
  );
}
