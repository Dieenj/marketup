'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cdnImageLoader, isOptimizableImage } from '@/lib/image-loader';

type RemoteImageProps = Omit<ImageProps, 'src' | 'loader'> & { src: string };

// next/image cho ảnh từ URL bên ngoài (sản phẩm, banner…): resize qua CDN gốc nếu được hỗ trợ,
// ngược lại hiển thị nguyên ảnh nhưng vẫn có lazy-load và giữ chỗ (tránh layout shift).
// Ảnh lỗi (link hỏng) được thay bằng ô placeholder thay vì hiện alt text đè lên giao diện.
export default function RemoteImage({ src, alt, className, fill, width, height, onError, ...props }: RemoteImageProps) {
  // Ghi nhớ theo src: đổi ảnh khác thì tự thử tải lại
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const optimizable = isOptimizableImage(src);

  if (failedSrc === src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn('flex items-center justify-center bg-muted text-muted-foreground/40', fill && 'absolute inset-0', className)}
        style={fill ? undefined : { width: Number(width), height: Number(height) }}
      >
        <ImageIcon className="size-1/4 min-h-4 min-w-4 max-h-10 max-w-10" aria-hidden />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      loader={optimizable ? cdnImageLoader : undefined}
      unoptimized={!optimizable}
      className={className}
      fill={fill}
      width={width}
      height={height}
      onError={(event) => {
        setFailedSrc(src);
        onError?.(event);
      }}
      {...props}
    />
  );
}
