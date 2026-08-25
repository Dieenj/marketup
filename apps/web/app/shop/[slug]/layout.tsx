'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ShoppingCart, Store } from 'lucide-react';
import { useCartStore } from '@/hooks/use-cart';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { getContrastColor } from '@/lib/color-utils';
import { useEffect } from 'react';

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const slug = params.slug as string;
  const { items } = useCartStore();

  const { data: shop } = useQuery({
    queryKey: ['shop', slug],
    queryFn: async () => {
      const { data } = await api.get(`/shops/${slug}`);
      return data;
    },
  });

  useEffect(() => {
    if (shop?.name) {
      document.title = `${shop.name} — MarketUp`;
    }
    return () => {
      document.title = 'MarketUp';
    };
  }, [shop?.name]);

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const primaryColor = shop?.primaryColor ?? '#111111';
  const primaryFg = getContrastColor(primaryColor);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <style>{`
        .shop-theme { --shop-primary: ${primaryColor}; --shop-primary-fg: ${primaryFg}; }
      `}</style>

      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/shop/${slug}`} className="flex items-center gap-2.5 group">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform"
              style={{ backgroundColor: primaryColor }}
            >
              <Store className="h-4 w-4" style={{ color: primaryFg }} />
            </div>
            <span className="font-bold text-[17px] tracking-tight">{shop?.name || slug.toUpperCase()}</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href={`/shop/${slug}/checkout`} aria-label="View cart">
              <button
                aria-label="View cart"
                className="relative flex items-center justify-center h-10 w-10 rounded-xl transition-colors"
                style={{ backgroundColor: primaryColor, color: primaryFg }}
              >
                <ShoppingCart className="h-4.5 w-4.5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4.5 w-4.5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 shop-theme">{children}</main>

      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-10">
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="h-7 w-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Store className="h-3.5 w-3.5" style={{ color: primaryFg }} />
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

            <div>
              <h3 className="font-semibold text-sm mb-3">Policies</h3>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                {['Return Policy', 'Shipping Policy', 'Customer Support'].map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t mt-8 pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {shop?.name || slug.toUpperCase()}. Powered by{' '}
            <Link href="/" className="font-semibold text-foreground hover:underline underline-offset-2">
              MarketUp
            </Link>
            .
          </div>
        </div>
      </footer>
    </div>
  );
}
