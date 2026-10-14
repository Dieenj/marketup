import { useQuery } from '@tanstack/react-query';
import api, { getErrorStatus } from '@/lib/api-client';
import { useAuthStore } from '@/hooks/use-auth';

interface Shop {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  bannerFocusX?: number;
  bannerFocusY?: number;
  primaryColor?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  isActive: boolean;
}

export const MY_SHOP_QUERY_KEY = ['my-shop'] as const;

// Shop của người bán đang đăng nhập — dùng chung cho layout, sidebar và các trang dashboard
export function useMyShop({ enabled = true }: { enabled?: boolean } = {}) {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: MY_SHOP_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get<Shop>('/shops/my-shop');
      return data;
    },
    enabled: enabled && !!user,
    // Lỗi 4xx (404 = chưa có shop, 401 = hết phiên) không thử lại; lỗi mạng/5xx thử tối đa 2 lần
    retry: (failureCount, error) => {
      const status = getErrorStatus(error);
      if (status !== undefined && status < 500) return false;
      return failureCount < 2;
    },
  });
}
