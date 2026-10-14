import { MapPin, Phone } from 'lucide-react';
import RemoteImage from '@/components/remote-image';
import { cn } from '@/lib/utils';
import { DEFAULT_SHOP_COLOR, getContrastColor, normalizeHexColor } from '@/lib/color-utils';
import type { StorefrontShop } from '@/lib/storefront-queries';

// Hero trang chủ shop. Dùng cả khi đang tải (loading.tsx) vì thông tin shop đã có sẵn từ layout —
// chỉ phần sản phẩm/thống kê/review bên dưới mới cần skeleton.
// Ảnh banner là nền (phủ tối để chữ dễ đọc); không có banner thì nền là màu thương hiệu.
// `preview`: bản thu gọn cho phần xem trước ở trang Settings (không tải trước ảnh như trang thật).
export default function ShopHero({
  shop,
  preview = false,
}: {
  shop: StorefrontShop;
  preview?: boolean;
}) {
  const Heading = preview ? 'p' : 'h1';
  const primaryColor = normalizeHexColor(shop.primaryColor);
  // Có banner: phủ lớp tối nên chữ trắng; không có banner: nền là màu thương hiệu → chữ theo độ tương phản
  const fg = shop.bannerUrl ? '#ffffff' : getContrastColor(primaryColor);
  const iconColor = primaryColor === DEFAULT_SHOP_COLOR ? '#34d399' : undefined;

  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: primaryColor, color: fg }}
    >
      {shop.bannerUrl && (
        <>
          {/* Ảnh lớn nhất trang (LCP): tải sớm, qua CDN Cloudinary để được nén + resize */}
          <RemoteImage
            src={shop.bannerUrl}
            alt=""
            fill
            sizes={preview ? '768px' : '100vw'}
            {...(!preview && { preload: true, loading: 'eager', fetchPriority: 'high' })}
            className="object-cover"
            // Phần ảnh người bán chọn giữ lại khi ảnh bị cắt vừa khung (Settings → Storefront appearance)
            style={{ objectPosition: `${shop.bannerFocusX ?? 50}% ${shop.bannerFocusY ?? 50}%` }}
          />
          <div className="absolute inset-0 bg-black/55" />
        </>
      )}
      <div
        className={cn(
          'relative container mx-auto px-4',
          preview ? 'py-10 sm:py-12' : 'py-20 sm:py-28',
        )}
      >
        <div className="max-w-2xl">
          {/* Bản xem trước nằm trong trang Settings (đã có h1 riêng) → không dùng h1 */}
          <Heading
            className={cn(
              'font-extrabold tracking-tight mb-4 leading-tight',
              preview ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl',
            )}
          >
            {shop.name}
          </Heading>
          <p className="opacity-75 text-base leading-relaxed mb-8 max-w-lg">
            {shop.description || 'Welcome to our store! Browse our collection of products.'}
          </p>
          <div className="flex flex-wrap gap-3">
            {shop.address && (
              <div className="flex items-center gap-1.5 text-sm opacity-85">
                <MapPin
                  className="h-3.5 w-3.5 shrink-0"
                  style={iconColor ? { color: iconColor } : undefined}
                  aria-hidden
                />
                {shop.address}
              </div>
            )}
            {shop.contactPhone && (
              <div className="flex items-center gap-1.5 text-sm opacity-85">
                <Phone
                  className="h-3.5 w-3.5 shrink-0"
                  style={iconColor ? { color: iconColor } : undefined}
                  aria-hidden
                />
                {shop.contactPhone}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
