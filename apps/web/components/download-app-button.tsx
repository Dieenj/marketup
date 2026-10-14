'use client';

import { useSyncExternalStore } from 'react';
import { Capacitor } from '@capacitor/core';
import { buttonVariants } from '@/components/ui/button';
import { Download } from 'lucide-react';

const noopSubscribe = () => () => {};

export default function DownloadAppButton() {
  // Server render coi như native (ẩn nút) để tránh lệch hydration; client đọc giá trị thật
  const isNative = useSyncExternalStore(
    noopSubscribe,
    () => Capacitor.isNativePlatform(),
    () => true,
  );

  if (isNative) return null;

  return (
    <a
      href="/downloads/marketup.apk"
      download
      className={buttonVariants({ size: 'xl', variant: 'outline' })}
    >
      <Download data-icon="inline-start" aria-hidden />
      Download App
    </a>
  );
}
