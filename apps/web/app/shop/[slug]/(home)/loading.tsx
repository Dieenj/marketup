import ScrollToTop from '@/components/scroll-to-top';
import StorefrontLoading from '../_components/storefront-loading';

// Chỉ áp dụng cho trang chủ shop (route group (home)) — checkout/order-success không bị skeleton này
export default function Loading() {
  return (
    <>
      <ScrollToTop />
      <StorefrontLoading />
    </>
  );
}
