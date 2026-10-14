import { cache } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api-client';
import type { Fetcher, StorefrontShop } from '@/lib/storefront-queries';

// Chỉ dùng trong Server Component / generateMetadata.

// API (Render) có thể cold start lâu: quá thời gian này thì trả HTML không kèm dữ liệu,
// Client Component sẽ tự fetch như trước — không để trang storefront bị treo.
const SERVER_FETCH_TIMEOUT_MS = 3000;

class ApiError extends Error {
  constructor(
    public status: number,
    path: string,
  ) {
    super(`API responded ${status} for ${path}`);
  }
}

export const serverFetcher: Fetcher = async <T>(path: string) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS),
    // Giá & tồn kho phải mới nhất → không dùng Data Cache
    cache: 'no-store',
  });
  if (!res.ok) throw new ApiError(res.status, path);
  return (await res.json()) as T;
};

type ServerResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'not-found' }
  | { status: 'unavailable' };

async function load<T>(path: string): Promise<ServerResult<T>> {
  try {
    return { status: 'ok', data: await serverFetcher<T>(path) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { status: 'not-found' };
    return { status: 'unavailable' };
  }
}

// cache(): generateMetadata, layout và page trong cùng một request chỉ gọi API một lần
export const getStorefrontShop = cache((slug: string) =>
  load<StorefrontShop>(`/shops/${encodeURIComponent(slug)}`),
);

interface StorefrontProductMeta {
  id: string;
  shopId?: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  images?: string[];
}

export const getStorefrontProduct = cache((productId: string) =>
  load<StorefrontProductMeta>(`/products/${encodeURIComponent(productId)}`),
);

export function makeServerQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 60 * 1000 },
    },
  });
}
