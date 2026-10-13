import { MapPin, Phone, Star } from 'lucide-react';
import RemoteImage from '@/components/remote-image';
import { DEFAULT_SHOP_COLOR, getContrastColor, normalizeHexColor } from '@/lib/color-utils';
import type { StorefrontShop } from '@/lib/storefront-queries';

// Hero trang chủ shop. Dùng cả khi đang tải (loading.tsx) vì thông tin shop đã có sẵn từ layout —
// chỉ phần sản phẩm/thống kê/review bên dưới mới cần skeleton.
export default function ShopHero({
  shop,
  onWriteReview,
}: {
  shop: StorefrontShop;
  /** Không truyền khi đang tải → nút hiện nhưng chưa bấm được */
  onWriteReview?: () => void;
}) {
  const primaryColor = normalizeHexColor(shop.primaryColor);
  // Có banner: phủ lớp tối nên chữ trắng; không có banner: nền là màu thương hiệu → chữ theo độ tương phản
  const fg = shop.bannerUrl ? '#ffffff' : getContrastColor(primaryColor);
  const iconColor = primaryColor === DEFAULT_SHOP_COLOR ? '#34d399' : undefined;

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: primaryColor, color: fg }}>
      {shop.bannerUrl && (
        <>
          {/* Ảnh lớn nhất trang (LCP): tải sớm, qua CDN Cloudinary để được nén + resize */}
          <RemoteImage
            src={shop.bannerUrl}
            alt=""
            fill
            sizes="100vw"
            preload
            loading="eager"
            fetchPriority="high"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/55" />
        </>
      )}
      <div className="relative container mx-auto px-4 py-20 sm:py-28">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight">{shop.name}</h1>
          <p className="opacity-75 text-base leading-relaxed mb-8 max-w-lg">
            {shop.description || 'Welcome to our store! Browse our collection of products.'}
          </p>
          <div className="flex flex-wrap gap-3">
            {shop.address && (
              <div className="flex items-center gap-1.5 text-sm opacity-85">
                <MapPin className="h-3.5 w-3.5 shrink-0" style={iconColor ? { color: iconColor } : undefined} aria-hidden />
                {shop.address}
              </div>
            )}
            {shop.contactPhone && (
              <div className="flex items-center gap-1.5 text-sm opacity-85">
                <Phone className="h-3.5 w-3.5 shrink-0" style={iconColor ? { color: iconColor } : undefined} aria-hidden />
                {shop.contactPhone}
              </div>
            )}
            <button
              type="button"
              onClick={onWriteReview}
              disabled={!onWriteReview}
              className="flex items-center gap-1 rounded-full border border-current/15 bg-current/10 px-3 py-1.5 text-xs font-semibold opacity-80 transition hover:bg-current/20 hover:opacity-100 disabled:pointer-events-none"
            >
              <Star className="h-3 w-3 fill-current" aria-hidden />
              Write a Review
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
