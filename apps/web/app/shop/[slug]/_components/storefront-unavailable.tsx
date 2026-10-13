'use client';

import { CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

// API không phản hồi (vd. Render đang khởi động lại) — khác với 404, dữ liệu vẫn tồn tại nên cho thử lại
export default function StorefrontUnavailable({
  onRetry,
  isRetrying,
}: {
  onRetry: () => void;
  isRetrying?: boolean;
}) {
  return (
    <div className="container mx-auto px-4 py-20 text-center" role="alert">
      <CloudOff className="mx-auto mb-4 h-12 w-12 text-muted-foreground" aria-hidden />
      <h1 className="mb-2 text-2xl font-bold">We couldn&apos;t load this page</h1>
      <p className="mb-6 text-muted-foreground">The store is temporarily unavailable. Please try again in a moment.</p>
      <Button size="lg" onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? 'Retrying…' : 'Try again'}
      </Button>
    </div>
  );
}
