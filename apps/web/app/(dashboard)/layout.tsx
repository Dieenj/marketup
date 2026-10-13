'use client';

import Sidebar from '@/components/dashboard/sidebar';
import { useAuthStore } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useHydrated } from '@/hooks/use-hydrated';
import { Menu } from 'lucide-react';
import { isAxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { useMyShop } from '@/hooks/use-my-shop';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  // Chờ hydrate xong để đọc trạng thái đăng nhập đã lưu trong localStorage
  const mounted = useHydrated();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  const { data: shop, isLoading: shopLoading, error: shopError, refetch: refetchShop, isRefetching } = useMyShop({ enabled: mounted });
  const shopErrorStatus = isAxiosError(shopError) ? shopError.response?.status : undefined;

  useEffect(() => {
    if (!mounted || !isAuthenticated || !shopError) return;
    if (shopErrorStatus === 404) {
      // Chưa có shop → tạo shop
      router.push('/setup');
    } else if (shopErrorStatus === 401) {
      // Token hết hạn/không hợp lệ → đăng xuất, tải lại trang để xoá cache
      logout();
      window.location.href = '/login';
    }
  }, [mounted, isAuthenticated, shopError, shopErrorStatus, router, logout]);

  // Lỗi khác (mạng, 5xx): cho phép thử lại thay vì chuyển trang
  if (mounted && isAuthenticated && shopError && shopErrorStatus !== 404 && shopErrorStatus !== 401) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/40 px-4" role="alert">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <p className="font-semibold">Couldn&apos;t load your shop</p>
          <p className="text-sm text-muted-foreground">
            Please check your connection and try again.
          </p>
          <Button variant="outline" onClick={() => refetchShop()} disabled={isRefetching}>
            {isRefetching ? 'Retrying…' : 'Try again'}
          </Button>
        </div>
      </div>
    );
  }

  if (!mounted || !isAuthenticated || shopLoading || !shop) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/40" role="status">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your shop…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-muted/40">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center h-14 px-4 border-b bg-background shrink-0 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="p-2 -ml-2 rounded-lg hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-2 font-semibold text-sm truncate">{shop.name ?? 'MarketUp'}</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

