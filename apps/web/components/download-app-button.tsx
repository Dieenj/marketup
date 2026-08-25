'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function DownloadAppButton() {
  const [isNative, setIsNative] = useState(true);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  if (isNative) return null;

  return (
    <a href="/downloads/marketup.apk" download>
      <Button
        size="lg"
        variant="outline"
        className="px-8 font-bold text-lg h-14 translate-y-0 hover:-translate-y-1 transition-transform"
      >
        <Download className="mr-2 h-5 w-5" />
        Download App
      </Button>
    </a>
  );
}
