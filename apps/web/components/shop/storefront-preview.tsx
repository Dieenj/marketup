'use client';

import { useRef } from 'react';
import { ArrowRight, Move, ShoppingCart } from 'lucide-react';
import ShopHero from '@/components/shop/shop-hero';
import RemoteImage from '@/components/remote-image';
import { cn } from '@/lib/utils';
import { getContrastColor, normalizeHexColor } from '@/lib/color-utils';
import type { StorefrontShop } from '@/lib/storefront-queries';

export interface BannerFocus {
  x: number;
  y: number;
}

const clamp = (value: number) => Math.round(Math.min(100, Math.max(0, value)));
const KEY_STEP = 2;

// Xem trước storefront ngay khi người bán đổi màu / banner (trước khi lưu).
// Phần đầu trang dùng đúng ShopHero của storefront; khung nhỏ bên dưới là cỡ điện thoại, nơi ảnh bị cắt khác.
// Có banner + onBannerFocusChange: kéo ảnh (hoặc dùng phím mũi tên) để chọn phần ảnh hiện trong khung.
export default function StorefrontPreview({
  shop,
  onBannerFocusChange,
}: {
  shop: StorefrontShop;
  onBannerFocusChange?: (focus: BannerFocus) => void;
}) {
  const primary = normalizeHexColor(shop.primaryColor);
  const fg = getContrastColor(primary);
  const editable = !!shop.bannerUrl && !!onBannerFocusChange;

  return (
    <div className="space-y-3">
      <figure className="relative overflow-hidden rounded-xl border bg-[#fafafa]">
        <BannerDragArea shop={shop} onChange={editable ? onBannerFocusChange : undefined}>
          <ShopHero shop={shop} preview />
        </BannerDragArea>
        <div className="flex flex-wrap items-center gap-2 border-t bg-white p-4">
          <span
            className="rounded-xl border px-4 py-1.5 text-sm font-medium"
            style={{ backgroundColor: primary, color: fg, borderColor: primary }}
          >
            All
          </span>
          <span className="rounded-xl border bg-white px-4 py-1.5 text-sm font-medium text-muted-foreground">
            Category
          </span>
          <span
            className="ml-auto inline-flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-semibold"
            style={{ backgroundColor: primary, color: fg }}
          >
            View details
            <ArrowRight className="size-3.5" aria-hidden />
          </span>
          <span
            className="inline-flex size-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: primary, color: fg }}
            aria-hidden
          >
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
            <BannerCrop shop={shop} label="Computer" aspect="aspect-[11/3]" className="flex-1" />
            <BannerCrop shop={shop} label="Phone" aspect="aspect-[10/9]" className="w-24" />
          </div>
        </div>
      )}
    </div>
  );
}

// Phần ảnh banner thật sự hiện ra ở storefront, đúng tỉ lệ khung đầu trang
// (đo trên storefront: máy tính ~1440×392 ≈ 11:3, điện thoại ~390×350 ≈ 10:9)
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
          style={{ objectPosition: `${shop.bannerFocusX ?? 50}% ${shop.bannerFocusY ?? 50}%` }}
        />
        <div className="absolute inset-0 bg-black/55" />
      </div>
      <figcaption className="text-[11px] text-muted-foreground">{label}</figcaption>
    </figure>
  );
}

// Lớp phủ trong suốt trên hero để kéo ảnh banner. Kéo ảnh sang phải → hiện phần bên trái của ảnh.
function BannerDragArea({
  shop,
  onChange,
  children,
}: {
  shop: StorefrontShop;
  onChange?: (focus: BannerFocus) => void;
  children: React.ReactNode;
}) {
  const drag = useRef<{ x: number; y: number; focus: BannerFocus } | null>(null);
  const focus = { x: shop.bannerFocusX ?? 50, y: shop.bannerFocusY ?? 50 };

  if (!onChange) return <>{children}</>;

  return (
    <div className="relative">
      {children}
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
    </div>
  );
}
