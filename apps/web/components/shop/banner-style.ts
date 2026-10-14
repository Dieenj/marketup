import type { CSSProperties } from 'react';
import type { StorefrontShop } from '@/lib/storefront-queries';

export const BANNER_ZOOM_MIN = 100;
export const BANNER_ZOOM_MAX = 200;

// Ảnh banner phủ kín khung (object-cover) nên chỉ thừa ra theo một chiều; phóng to quanh điểm
// người bán chọn thì thừa ra cả 4 phía → kéo chỉnh được cả ngang lẫn dọc.
// x = 0 giữ mép trái, 100 giữ mép phải (tương tự với y), dù có phóng to hay không.
// Khung chứa ảnh phải có overflow-hidden. Dùng ở storefront và các khung xem trước ở Settings.
export function bannerImageStyle(
  shop: Pick<StorefrontShop, 'bannerFocusX' | 'bannerFocusY' | 'bannerZoom'>,
): CSSProperties {
  const position = `${shop.bannerFocusX ?? 50}% ${shop.bannerFocusY ?? 50}%`;
  const zoom = (shop.bannerZoom ?? BANNER_ZOOM_MIN) / 100;
  return {
    objectPosition: position,
    ...(zoom > 1 && { transform: `scale(${zoom})`, transformOrigin: position }),
  };
}
