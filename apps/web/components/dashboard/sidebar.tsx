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
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { useCallback, useEffect, useRef, useState } from 'react';

const menuItems = [
  { name: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Products', icon: Package, href: '/products' },
  { name: 'Orders', icon: ShoppingCart, href: '/orders' },
  { name: 'Reviews', icon: MessageSquare, href: '/reviews' },
  { name: 'Shop Settings', icon: Settings, href: '/settings' },
];

const MIN_WIDTH = 200;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 256;
const STORAGE_KEY = 'sidebar-width';

export default function Sidebar({
  isOpen = false,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const widthRef = useRef(DEFAULT_WIDTH);

  const { data: shop } = useQuery({
    queryKey: ['my-shop'],
    queryFn: async () => {
      const { data } = await api.get('/shops/my-shop');
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = Number(saved);
      if (parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
        setWidth(parsed);
        widthRef.current = parsed;
      }
    }
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      widthRef.current = newWidth;
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem(STORAGE_KEY, String(widthRef.current));
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full flex-col bg-[#111111] text-white shrink-0 transition-transform duration-200 ease-out',
          'md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ width }}
      >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-white/8">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onClose}>
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
            <Store className="h-4.5 w-4.5 text-[#111111]" />
          </div>
          <span className="font-bold text-[17px] tracking-tight text-white truncate">MarketUp</span>
        </Link>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/50 hover:bg-white/8 hover:text-white md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-0.5">
        <p className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/30">
          Menu
        </p>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-150',
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
              <span className="truncate">{item.name}</span>
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
              className="group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all text-white/60 hover:bg-white/8 hover:text-white"
            >
              <ExternalLink className="h-4.5 w-4.5 text-white/50 group-hover:text-white shrink-0" />
              <span className="truncate">View Your Shop</span>
              <ExternalLink className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
            </a>
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/8 space-y-1">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5">
          <div className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-white">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate leading-tight">{user?.name}</p>
            <p className="text-[11px] text-white/40 truncate leading-tight">{user?.email}</p>
          </div>
        </div>
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all"
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          <span>Log out</span>
        </button>
      </div>

      {/* Drag handle */}
      <div
        className={cn(
          'absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors group/handle hidden md:block',
          isResizing ? 'bg-white/30' : 'hover:bg-white/20',
        )}
        onMouseDown={startResize}
      >
        <div className={cn(
          'absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 rounded-full bg-white/0 group-hover/handle:bg-white/40 transition-all',
          isResizing && 'bg-white/60',
        )} />
      </div>
      </div>
    </>
  );
}
