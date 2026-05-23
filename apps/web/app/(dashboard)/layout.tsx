'use client';

import Sidebar from '@/components/dashboard/sidebar';
import { useAuthStore } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  const { data: shop, isLoading: shopLoading, isError: shopError } = useQuery({
    queryKey: ['my-shop'],
    queryFn: async () => {
      const { data } = await api.get('/shops/my-shop');
      return data;
    },
    enabled: mounted && isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (mounted && isAuthenticated && !shopLoading && shopError) {
      router.push('/setup');
    }
  }, [mounted, isAuthenticated, shopLoading, shopError, router]);

  if (!mounted || !isAuthenticated || shopLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8f8f8]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-[#111111] border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!shop) return null;

  return (
    <div className="flex h-screen bg-[#f5f5f5]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-10 py-8">{children}</div>
      </main>
    </div>
  );
}

