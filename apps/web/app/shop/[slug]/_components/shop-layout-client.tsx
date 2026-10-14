'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Package, ShoppingCart, Store } from 'lucide-react';
import { useShopCart } from '@/hooks/use-cart';
import { useQuery } from '@tanstack/react-query';
import { brandThemeStyle } from '@/components/shop/brand-theme';
import { storefrontQueries } from '@/lib/storefront-queries';

const q = storefrontQueries();

export default function ShopLayoutClient({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const slug = params.slug as string;

  // Dữ liệu đã được prefetch ở server (layout.tsx) và hydrate vào cache; tiêu đề trang do generateMetadata đặt
  const { data: shop } = useQuery(q.shop(slug));

  const cartLines = useShopCart(shop?.id);
  const cartCount = cartLines.reduce((acc, line) => acc + line.quantity, 0);
  // Cả storefront dùng màu thương hiệu làm màu chính (nút, tab, nút lọc…)
  // scroll-padding-top = chiều cao header sticky (h-16): khi điều hướng, Next cuộn tới đầu trang mới mà không bị header che
  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      style={brandThemeStyle(shop?.primaryColor)}
    >
      <style>{'html { scroll-padding-top: 4rem; }'}</style>

      <header className="sticky top-0 z-50 border-b bg-background/90 shadow-xs backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/shop/${slug}`} className="flex items-center gap-2.5 group">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <Store className="size-4" aria-hidden />
            </div>
            <span className="font-bold text-[17px] tracking-tight">
              {shop?.name || slug.toUpperCase()}
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={`/shop/${slug}/orders`}
              className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Package className="h-4.5 w-4.5" aria-hidden />
              <span className="sr-only sm:not-sr-only">My orders</span>
            </Link>
            <Link
              href={`/shop/${slug}/checkout`}
              aria-label={cartCount > 0 ? `View cart (${cartCount} items)` : 'View cart'}
              className="relative flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ShoppingCart className="h-4.5 w-4.5" aria-hidden />
              {cartCount > 0 && (
                <span
                  aria-hidden
                  className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white"
                >
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-10">
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Store className="size-3.5" aria-hidden />
                </div>
                <span className="font-bold text-sm">{shop?.name || slug.toUpperCase()}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {shop?.description || 'Welcome to our store!'}
              </p>
            </div>

            {(shop?.address || shop?.contactPhone || shop?.contactEmail) && (
              <div>
                <h3 className="font-semibold text-sm mb-3">Contact</h3>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  {shop?.address && <p>{shop.address}</p>}
                  {shop?.contactPhone && <p>{shop.contactPhone}</p>}
                  {shop?.contactEmail && <p>{shop.contactEmail}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="border-t mt-8 pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {shop?.name || slug.toUpperCase()}. Powered by{' '}
            <Link
              href="/"
              className="font-semibold text-foreground hover:underline underline-offset-2"
            >
              MarketUp
            </Link>
            .
          </div>
        </div>
      </footer>
    </div>
  );
}
