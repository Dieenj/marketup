'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export default function PwaRegister() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Installability is a progressive enhancement; ignore registration failures.
    });
  }, []);

  return null;
}
