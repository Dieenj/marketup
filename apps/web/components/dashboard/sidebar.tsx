'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings, 
  Store,
  LogOut,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';

const menuItems = [
  { name: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Products', icon: Package, href: '/products' },
  { name: 'Orders', icon: ShoppingCart, href: '/orders' },
  { name: 'Reviews', icon: MessageSquare, href: '/reviews' },
  { name: 'Shop Settings', icon: Settings, href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();

  const { data: shop } = useQuery({
    queryKey: ['my-shop'],
    queryFn: async () => {
      const { data } = await api.get('/shops/my-shop');
      return data;
    },
    enabled: !!user,
  });

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="flex h-full w-100 flex-col bg-[#111111] text-white">
      {/* Phần Logo */}
      <div className="flex h-16 items-center px-6 border-b border-white/8">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Store className="h-4.5 w-4.5 text-[#111111]" />
          </div>
          <span className="font-bold text-[17px] tracking-tight text-white">MarketUp</span>
        </Link>
      </div>

      {/* Phần Menu Điều hướng */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-0.5">
        <p className="px-3 mb-3 text-[20px] font-semibold uppercase tracking-widest text-white/30">
          Menu
        </p>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-10 py-2.5 text-sm font-medium rounded-xl transition-all duration-150',
                isActive
                  ? 'bg-white text-[#111111]'
                  : 'text-white/60 hover:bg-white/8 hover:text-white',
              )}
            >
              <item.icon
                className={cn(
                  'h-4.5 w-4.5 shrink-0 transition-colors',
                  isActive ? 'text-[#111111]' : 'text-white/50 group-hover:text-white',
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {shop && (
          <>
            <div className="pt-4 pb-1">
              <div className="border-t border-white/8" />
            </div>
            <a
              href={`/shop/${shop.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all text-white/60 hover:bg-white/8 hover:text-white"
            >
              <ExternalLink className="h-4.5 w-4.5 text-white/50 group-hover:text-white shrink-0" />
              <span>View Your Shop</span>
              <ExternalLink className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
            </a>
          </>
        )}
      </nav>

      {/* Phần người dùng và Đăng xuất */}
      <div className="p-4 border-t border-white/8 space-y-1">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
          <div className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-white">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate leading-tight">{user?.name}</p>
            <p className="text-[11px] text-white/40 truncate leading-tight">{user?.email}</p>
          </div>
        </div>
        <button
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all"
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}


