import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

// true sau khi hydrate ở client, false khi render phía server/prerender.
// Dùng để chờ dữ liệu chỉ có ở trình duyệt (localStorage, Capacitor…) mà không gây lệch hydration.
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
