'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ShoppingCart, Store } from 'lucide-react';
import { useCartStore } from '@/hooks/use-cart';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';

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

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/shop/${slug}`} className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-[#111111] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Store className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-[17px] tracking-tight">{shop?.name || slug.toUpperCase()}</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href={`/shop/${slug}/checkout`}>
              <button className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-[#111111] text-white hover:bg-[#222222] transition-colors">
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

      <main className="flex-1">{children}</main>

      <footer className="border-t py-10 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-[#111111] flex items-center justify-center">
              <Store className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">{shop?.name || slug.toUpperCase()}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {shop?.name || slug.toUpperCase()}. Powered by{' '}
            <Link href="/" className="font-semibold text-foreground hover:underline underline-offset-2">
              MarketUp
            </Link>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}

