'use client';

import { useEffect, useRef } from 'react';

// Xem trước một File đã chọn. Tạo object URL một lần cho mỗi file và giải phóng khi đổi file/unmount,
// tránh rò rỉ bộ nhớ khi gọi URL.createObjectURL trực tiếp trong render.
export default function FilePreviewImage({
  file,
  alt,
  className,
}: {
  file: File;
  alt: string;
  className?: string;
}) {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (ref.current) ref.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // eslint-disable-next-line @next/next/no-img-element -- blob: URL không dùng được với next/image
  return <img ref={ref} alt={alt} className={className} />;
}
