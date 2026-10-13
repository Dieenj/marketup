import type { ImageLoaderProps } from 'next/image';

// Loader cho next/image dùng CDN của chính nguồn ảnh, thay vì Image Optimization của Vercel (giới hạn/tính phí theo ảnh).
// - Cloudinary (ảnh người bán upload): chèn transformation f_auto,q_auto,w_<width>
// - Unsplash (ảnh mẫu trong seed): tham số w, q, auto=format
// Nguồn khác: không tối ưu được → RemoteImage đặt `unoptimized`.

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

function isUnsplash(url: URL) {
  return url.hostname === 'images.unsplash.com';
}

export function isOptimizableImage(src: string) {
  if (CLOUDINARY_UPLOAD.test(src)) return true;
  try {
    return isUnsplash(new URL(src));
  } catch {
    return false;
  }
}

export function cdnImageLoader({ src, width, quality }: ImageLoaderProps) {
  const cloudinary = CLOUDINARY_UPLOAD.exec(src);
  if (cloudinary) {
    const q = quality ? `q_${quality}` : 'q_auto';
    return `${cloudinary[1]}f_auto,${q},c_limit,w_${width}/${cloudinary[2]}`;
  }

  const url = new URL(src);
  if (isUnsplash(url)) {
    url.searchParams.set('w', String(width));
    url.searchParams.set('q', String(quality ?? 75));
    url.searchParams.set('auto', 'format');
    url.searchParams.set('fit', 'max');
    return url.toString();
  }
  return src;
}
