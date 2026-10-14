'use client';

import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Move, ShoppingCart } from 'lucide-react';
import ShopHero from '@/components/shop/shop-hero';
import RemoteImage from '@/components/remote-image';
import { cn } from '@/lib/utils';
import { brandThemeStyle } from '@/components/shop/brand-theme';
import { bannerImageStyle } from '@/components/shop/banner-style';
import { buttonVariants } from '@/components/ui/button';
import { filterChipVariants } from '@/components/ui/filter-chip';
import { storefrontQueries, type StorefrontShop } from '@/lib/storefront-queries';

export interface BannerFocus {
  x: number;
  y: number;
}

const clamp = (value: number) => Math.round(Math.min(100, Math.max(0, value)));
const KEY_STEP = 2;
const q = storefrontQueries();

// Xem trước storefront ngay khi người bán đổi màu / banner (trước khi lưu).
// Phần đầu trang dùng đúng ShopHero của storefront; khung nhỏ bên dưới cho thấy ảnh bị cắt thế nào.
// Có banner + onBannerFocusChange: kéo ảnh (hoặc dùng phím mũi tên) để chọn phần ảnh hiện trong khung.
export default function StorefrontPreview({
  shop,
  onBannerFocusChange,
}: {
  shop: StorefrontShop;
  onBannerFocusChange?: (focus: BannerFocus) => void;
}) {
  const editable = !!shop.bannerUrl && !!onBannerFocusChange;
  // Điểm đánh giá thật của shop (cùng query với storefront); trang tạo shop chưa có shop → không gọi
  const { data: stats } = useQuery({ ...q.shopStats(shop.id), enabled: !!shop.id });

  return (
    <div className="space-y-3">
      {/* Khung xem trước tô theo màu đang chọn, giống storefront thật (nút mẫu không bấm được) */}
      <figure
        className="relative overflow-hidden rounded-xl border bg-background"
        style={brandThemeStyle(shop.primaryColor)}
      >
        <ShopHero
          shop={shop}
          rating={stats?.averageRating}
          preview
          bannerOverlay={editable && <BannerDragArea shop={shop} onChange={onBannerFocusChange} />}
        />
        <div className="flex flex-wrap items-center gap-2 border-t bg-card p-4" aria-hidden>
          <span className={filterChipVariants({ active: true })}>All</span>
          <span className={filterChipVariants()}>Category</span>
          <span
            className={buttonVariants({ className: 'ml-auto h-9 gap-2 text-xs font-semibold' })}
          >
            View details
            <ArrowRight className="size-3.5" />
          </span>
          <span className={buttonVariants({ size: 'icon', className: 'size-10' })}>
            <ShoppingCart className="size-4" />
          </span>
        </div>
        <figcaption className="sr-only">Preview of your storefront on a computer</figcaption>
      </figure>

      {shop.bannerUrl && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">
            What shows at the top of your storefront. Drag the preview above to change it.
          </p>
          <div className="flex items-end gap-3">
            <BannerCrop shop={shop} label="Computer" aspect="aspect-[11/5]" className="w-60" />
            <BannerCrop shop={shop} label="Phone" aspect="aspect-video" className="w-40" />
          </div>
        </div>
      )}
    </div>
  );
}

// Phần ảnh banner thật sự hiện ra ở storefront, đúng tỉ lệ khung đầu trang
// (đo trên storefront: máy tính 1440px ảnh ~840×384 ≈ 11:5, điện thoại 16:9)
function BannerCrop({
  shop,
  label,
  aspect,
  className,
}: {
  shop: StorefrontShop;
  label: string;
  aspect: string;
  className: string;
}) {
  return (
    <figure className={cn('space-y-1', className)}>
      <div className={cn('relative overflow-hidden rounded-md border', aspect)}>
        <RemoteImage
          src={shop.bannerUrl!}
          alt=""
          fill
          sizes="240px"
          className="object-cover"
          style={bannerImageStyle(shop)}
        />
      </div>
      <figcaption className="text-[11px] text-muted-foreground">{label}</figcaption>
    </figure>
  );
}

// Lớp trong suốt phủ lên ảnh banner để kéo ảnh. Kéo ảnh sang phải → hiện phần bên trái của ảnh.
function BannerDragArea({
  shop,
  onChange,
}: {
  shop: StorefrontShop;
  onChange: (focus: BannerFocus) => void;
}) {
  const drag = useRef<{ x: number; y: number; focus: BannerFocus } | null>(null);
  const focus = { x: shop.bannerFocusX ?? 50, y: shop.bannerFocusY ?? 50 };

  return (
    <div
      role="application"
      tabIndex={0}
      aria-label={`Banner position ${focus.x}% across, ${focus.y}% down. Drag, or use the arrow keys, to move the image.`}
      className="group absolute inset-0 cursor-grab touch-none outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, focus };
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const { width, height } = e.currentTarget.getBoundingClientRect();
        onChange({
          x: clamp(drag.current.focus.x - ((e.clientX - drag.current.x) / width) * 100),
          y: clamp(drag.current.focus.y - ((e.clientY - drag.current.y) / height) * 100),
        });
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onKeyDown={(e) => {
        const move: Record<string, [number, number]> = {
          ArrowLeft: [KEY_STEP, 0],
          ArrowRight: [-KEY_STEP, 0],
          ArrowUp: [0, KEY_STEP],
          ArrowDown: [0, -KEY_STEP],
        };
        const delta = move[e.key];
        if (!delta) return;
        e.preventDefault();
        onChange({ x: clamp(focus.x + delta[0]), y: clamp(focus.y + delta[1]) });
      }}
    >
      <span className="pointer-events-none absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white opacity-80 group-hover:opacity-100">
        <Move className="size-3.5" aria-hidden />
        Drag to reposition
      </span>
    </div>
  );
}
