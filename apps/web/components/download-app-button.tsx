'use client';

import { useSyncExternalStore } from 'react';
import { Capacitor } from '@capacitor/core';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Download } from 'lucide-react';

const noopSubscribe = () => () => {};

export default function DownloadAppButton() {
  // Server render coi như native (ẩn nút) để tránh lệch hydration; client đọc giá trị thật
  const isNative = useSyncExternalStore(noopSubscribe, () => Capacitor.isNativePlatform(), () => true);

  if (isNative) return null;

  return (
    <a
      href="/downloads/marketup.apk"
      download
      className={cn(
        buttonVariants({ size: 'lg', variant: 'outline' }),
        'px-8 font-bold text-lg h-14 translate-y-0 hover:-translate-y-1 transition-transform',
      )}
    >
      <Download className="mr-2 h-5 w-5" aria-hidden />
      Download App
    </a>
  );
}
