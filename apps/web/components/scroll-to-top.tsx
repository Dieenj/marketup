'use client';

import { useLayoutEffect } from 'react';

// Next chỉ cuộn về đầu khi trang mới render xong, không cuộn khi hiện loading.tsx →
// skeleton hiện ở vị trí cuộn của trang cũ rồi giật lên. Đặt trong loading.tsx để cuộn ngay từ đầu.
export default function ScrollToTop() {
  useLayoutEffect(() => {
    // 'instant': bỏ qua scroll-behavior: smooth của trang — chuyển trang thì nhảy lên đầu như tải trang mới
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  return null;
}
