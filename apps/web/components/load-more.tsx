'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

// Cuộn gần tới cuối danh sách thì tự tải trang sau (giống Shopee).
// Nút vẫn hiện để bấm bằng bàn phím hoặc khi trình duyệt không tự kích hoạt được.
export default function LoadMore({
  hasMore,
  isLoading,
  onLoadMore,
}: {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !hasMore || isLoading) return;
    // Đang hiện sẵn trên màn hình (danh sách ngắn) thì cũng tải tiếp ngay
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { rootMargin: '400px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  if (!hasMore) return null;
  return (
    <div ref={ref} className="flex justify-center py-4">
      <Button variant="outline" size="sm" onClick={onLoadMore} disabled={isLoading}>
        {isLoading ? 'Loading…' : 'Load more'}
      </Button>
    </div>
  );
}
