'use client';

import Sidebar from '@/components/dashboard/sidebar';
import { useAuthStore } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useHydrated } from '@/hooks/use-hydrated';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardContentSkeleton from '@/components/dashboard/dashboard-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyShop } from '@/hooks/use-my-shop';
import { getErrorStatus } from '@/lib/api-client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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

  const {
    data: shop,
    error: shopError,
    refetch: refetchShop,
    isRefetching,
  } = useMyShop({ enabled: mounted });
  const shopErrorStatus = getErrorStatus(shopError);

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

  // Khung (sidebar + header) luôn hiện ngay; chỉ vùng nội dung đổi giữa skeleton / lỗi / trang thật
  const isReady = mounted && isAuthenticated && !!shop;
  // Lỗi khác (mạng, 5xx): cho phép thử lại thay vì chuyển trang
  const hasBlockingError =
    mounted && isAuthenticated && !!shopError && shopErrorStatus !== 404 && shopErrorStatus !== 401;

  let content: React.ReactNode;
  if (hasBlockingError) {
    content = (
      <div className="flex min-h-[400px] items-center justify-center" role="alert">
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
  } else if (!isReady) {
    content = <DashboardContentSkeleton />;
  } else {
    content = children;
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
          {shop ? (
            <span className="ml-2 font-semibold text-sm truncate">{shop.name}</span>
          ) : (
            <Skeleton className="ml-2 h-4 w-28" />
          )}
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">{content}</div>
        </main>
      </div>
    </div>
  );
}
