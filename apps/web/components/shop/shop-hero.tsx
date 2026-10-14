import { Mail, MapPin, Phone, Star } from 'lucide-react';
import RemoteImage from '@/components/remote-image';
import { cn } from '@/lib/utils';
import { DEFAULT_SHOP_COLOR, normalizeHexColor } from '@/lib/color-utils';
import type { StorefrontShop } from '@/lib/storefront-queries';
import { bannerImageStyle } from '@/components/shop/banner-style';

// Hero trang chủ shop. Phải nằm trong phần tử có brandThemeStyle (màu thương hiệu).
// Dùng cả khi đang tải (loading.tsx) vì thông tin shop đã có sẵn từ layout —
// chỉ phần sản phẩm/review bên dưới mới cần skeleton.
// Chia đôi: bên trái nền màu thương hiệu với thông tin shop, bên phải ảnh banner — màn lớn ảnh rộng hơn (7/12)
// (điện thoại: ảnh ở trên, thông tin ở dưới). Không có banner thì màu thương hiệu phủ cả khung.
// `rating`: điểm trung bình của shop, chỉ hiện khi đã có đánh giá.
// `preview`: bản xem trước ở trang Settings (không tải trước ảnh, tên shop không phải h1).
// `bannerOverlay`: lớp đặt trên ảnh banner (Settings dùng để kéo chỉnh vị trí ảnh).
export default function ShopHero({
  shop,
  rating,
  preview = false,
  bannerOverlay,
}: {
  shop: StorefrontShop;
  rating?: number;
  preview?: boolean;
  bannerOverlay?: React.ReactNode;
}) {
  const Heading = preview ? 'p' : 'h1';
  // Nền đen mặc định: icon liên hệ màu xanh cho nổi; màu khác thì icon cùng màu chữ
  const iconColor =
    normalizeHexColor(shop.primaryColor) === DEFAULT_SHOP_COLOR ? '#34d399' : undefined;
  const contacts = [
    { key: 'address', icon: MapPin, value: shop.address },
    { key: 'phone', icon: Phone, value: shop.contactPhone },
    { key: 'email', icon: Mail, value: shop.contactEmail },
  ].filter((c) => c.value);

  return (
    // Màu nền/chữ lấy từ màu thương hiệu (brandThemeStyle ở layout storefront hoặc khung xem trước)
    <section className="@container relative overflow-hidden bg-primary text-primary-foreground">
      {shop.bannerUrl && (
        // Nằm trên khối chữ (khối chữ rộng cả khung nhưng chữ chỉ ở nửa trái) để kéo chỉnh được ảnh
        <div className="relative z-10 aspect-video overflow-hidden md:absolute md:inset-y-0 md:right-0 md:aspect-auto md:w-1/2 lg:w-7/12">
          {/* Ảnh lớn nhất trang (LCP): tải sớm, qua CDN Cloudinary để được nén + resize */}
          <RemoteImage
            src={shop.bannerUrl}
            alt=""
            fill
            sizes={preview ? '640px' : '(min-width: 768px) 50vw, 100vw'}
            {...(!preview && { preload: true, loading: 'eager', fetchPriority: 'high' })}
            className="object-cover"
            // Vị trí + mức phóng người bán chọn (Settings → Storefront appearance)
            style={bannerImageStyle(shop)}
          />
          {bannerOverlay}
        </div>
      )}
      <div className="relative container mx-auto px-4">
        <div
          className={cn(
            'flex flex-col justify-center py-12 md:min-h-96 md:py-16',
            // Cột chữ dừng trước ảnh: ảnh bắt đầu ở 5/12 bề rộng khung (100cqw), mép trái nội dung
            // container cách mép khung (100cqw - 100%) / 2; chừa 3rem khoảng cách
            shop.bannerUrl
              ? 'md:w-1/2 md:pr-12 lg:w-[calc(100cqw*5/12_-_(100cqw_-_100%)/2_-_3rem)] lg:pr-0'
              : 'max-w-2xl',
          )}
        >
          {/* Bản xem trước nằm trong trang Settings (đã có h1 riêng) → không dùng h1 */}
          <Heading className="mb-4 text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
            {shop.name}
          </Heading>
          <p className="mb-6 max-w-lg text-base leading-relaxed opacity-75">
            {shop.description || 'Welcome to our store! Browse our collection of products.'}
          </p>
          {!!rating && rating > 0 && (
            <div
              role="img"
              aria-label={`Rated ${rating} out of 5`}
              className="mb-6 flex items-center gap-2"
            >
              <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
              <span className="font-semibold" aria-hidden>
                {rating}
                <span className="font-normal opacity-75">/5</span>
              </span>
            </div>
          )}
          {contacts.length > 0 && (
            <ul className="space-y-2 text-sm">
              {contacts.map(({ key, icon: Icon, value }) => (
                <li key={key} className="flex min-w-0 items-center gap-1.5 opacity-85">
                  <Icon
                    className="size-3.5 shrink-0"
                    style={iconColor ? { color: iconColor } : undefined}
                    aria-hidden
                  />
                  <span className="break-all">{value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
